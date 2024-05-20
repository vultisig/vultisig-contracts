import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  NonfungiblePositionManager as NonfungiblePositionManagerContract,
  SwapRouter,
  UniswapV3Factory,
} from "../../typechain-types";
import { Percent, Token } from "@uniswap/sdk-core";
import { encodeSqrtRatioX96, nearestUsableTick, NonfungiblePositionManager, Position, Pool } from "@uniswap/v3-sdk";

import {
  abi as FACTORY_ABI,
  bytecode as FACTORY_BYTECODE,
} from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";

import {
  abi as MANAGER_ABI,
  bytecode as MANAGER_BYTECODE,
} from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";

import {
  abi as SWAP_ROUTER_ABI,
  bytecode as SWAP_ROUTER_BYTECODE,
} from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

// Set initial price 0.01 USDC
// const VULTISIG_AMOUNT = ethers.parseUnits("10000000", 18);
// const USDC_AMOUNT = ethers.parseUnits("100000", 18);
const VULTISIG_AMOUNT = ethers.parseUnits("10000000", 18);
const USDC_AMOUNT = ethers.parseUnits("10000000", 18);
const FEE = 3000;

describe("VultisigWhitelisted with Whitelist", function () {
  async function deployVultisigWhitelistedFixture() {
    const [owner, buyer, otherAccount] = await ethers.getSigners();

    const VultisigWhitelisted = await ethers.getContractFactory("VultisigWhitelisted");
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const MockUSDC = await ethers.getContractFactory("Vultisig");
    const vultisig = await VultisigWhitelisted.deploy();
    const whitelist = await Whitelist.deploy();
    const mockUSDC = await MockUSDC.deploy();
    await whitelist.setVultisig(vultisig);
    await vultisig.setWhitelistContract(whitelist);

    // Transfer test tokens to other account
    await mockUSDC.transfer(otherAccount, USDC_AMOUNT);

    // Deploy uniswap v3 contracts - Uniswap V3 Factory, PositionManager, and Router
    const UniswapV3Factory = await ethers.getContractFactory(FACTORY_ABI, FACTORY_BYTECODE);
    const factory = (await UniswapV3Factory.deploy()) as UniswapV3Factory;
    await factory.waitForDeployment();
    const PositionManagerFactory = await ethers.getContractFactory(MANAGER_ABI, MANAGER_BYTECODE);
    const factoryAddress = await factory.getAddress();
    const positionManager = (await PositionManagerFactory.deploy(
      factoryAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
    )) as NonfungiblePositionManagerContract;
    await positionManager.waitForDeployment();
    const positionManagerAddress = await positionManager.getAddress();

    const RouterFactory = await ethers.getContractFactory(SWAP_ROUTER_ABI, SWAP_ROUTER_BYTECODE);
    const router = (await RouterFactory.deploy(factoryAddress, ethers.ZeroAddress)) as SwapRouter;
    await router.waitForDeployment();

    await whitelist.setPositionManager(positionManagerAddress);
    await whitelist.setSwapRouter(await router.getAddress());

    // Create the pool
    const tokenA = await vultisig.getAddress();
    const tokenB = await mockUSDC.getAddress();

    await factory.createPool(tokenA, tokenB, FEE);
    const poolAddress = await factory.getPool(tokenA, tokenB, FEE);
    expect(poolAddress).to.not.equal(ethers.ZeroAddress);
    await whitelist.setPool(poolAddress);

    // Initialize the pool
    const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);
    await pool.initialize(encodeSqrtRatioX96(1, 1).toString());

    // Approve the position manager to spend tokens
    await vultisig.approve(positionManagerAddress, VULTISIG_AMOUNT);
    await mockUSDC.approve(positionManagerAddress, USDC_AMOUNT);

    // Check balance
    expect(await vultisig.balanceOf(owner)).to.gt(VULTISIG_AMOUNT);
    expect(await mockUSDC.balanceOf(owner)).to.gt(USDC_AMOUNT);

    const slot = await pool.slot0();
    const liquidity = await pool.liquidity();

    const state = {
      liquidity,
      sqrtPriceX96: slot[0],
      tick: slot[1],
      observationIndex: slot[2],
      observationCardinality: slot[3],
      observationCardinalityNext: slot[4],
      feeProtocol: slot[5],
      unlocked: slot[6],
    };

    const Token1 = new Token(hre.network.config.chainId as number, tokenA, 18);
    const Token2 = new Token(hre.network.config.chainId as number, tokenB, 18);

    const configuredPool = new Pool(
      Token1,
      Token2,
      FEE,
      state.sqrtPriceX96.toString(),
      state.liquidity.toString(),
      Number(state.tick),
    );

    const position = Position.fromAmounts({
      pool: configuredPool,
      tickLower:
        nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing * 2,
      tickUpper:
        nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing * 2,
      amount0: VULTISIG_AMOUNT.toString(),
      amount1: USDC_AMOUNT.toString(),
      useFullPrecision: false,
    });

    const mintOptions = {
      recipient: owner.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      slippageTolerance: new Percent(50, 10_000),
    };

    const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions);

    const transaction = {
      data: calldata,
      to: positionManagerAddress,
      value: value,
      from: owner.address,
      gasLimit: 10000000,
    };
    const txRes = await owner.sendTransaction(transaction);
    await txRes.wait();
    // Check the liquidity
    const liquidityAfter = await pool.liquidity();
    expect(liquidityAfter).to.be.gt(0);

    // Deploy uniswap v3 oracle
    const OracleFactory = await ethers.getContractFactory("UniswapV3Oracle");
    const oracle = await OracleFactory.deploy(poolAddress, tokenA, tokenB);
    await oracle.waitForDeployment();

    const priceTx = await pool.increaseObservationCardinalityNext(10);
    await priceTx.wait();

    await whitelist.setOracle(oracle);
    return { vultisig, mockUSDC, whitelist, factory, positionManager, router, owner, buyer, otherAccount };
  }

  describe("Transfer", function () {
    it("Should transfer integration", async function () {
      const amount = ethers.parseUnits("1000", 18);
      const { vultisig, mockUSDC, whitelist, owner, router, otherAccount } = await loadFixture(
        deployVultisigWhitelistedFixture,
      );
      const routerAddress = await router.getAddress();
      await mockUSDC.connect(otherAccount).approve(routerAddress, amount);

      // Perform the swap
      const swapParams = {
        tokenIn: await mockUSDC.getAddress(),
        tokenOut: await vultisig.getAddress(),
        fee: FEE,
        recipient: otherAccount.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        amountIn: amount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      // Remove locked status
      await whitelist.setLocked(false);
      await whitelist.setMaxAddressCap(ethers.parseUnits("10000", 18));
      await whitelist.addWhitelistedAddress(otherAccount);
      await whitelist.setAllowedWhitelistIndex(1);
      await router.connect(otherAccount).exactInputSingle(swapParams);

      // Check the balance of TokenB
      const balanceB = await vultisig.balanceOf(otherAccount);
      expect(balanceB).to.be.gt(0);
    });
  });
});
