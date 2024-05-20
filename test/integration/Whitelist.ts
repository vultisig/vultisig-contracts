import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VultisigWhitelisted } from "../../typechain-types";
import IUniswapV3PoolABI from "./abis/IUniswapV3Pool.json";
import IUniswapV3FactoryABI from "./abis/IUniswapV3Factory.json";
import USDCABI from "./abis/USDC.json";
import NFPMABI from "./abis/NFPM.json";

const FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_WHALE = "0x28C6c06298d514Db089934071355E5743bf21d60";
const USDC_AMOUNT = ethers.parseUnits("100", 6);
const VULTISIG_AMOUNT = ethers.parseUnits("10000", 18);
const FEE = 3000;

describe("VultisigWhitelisted with Whitelist", function () {
  async function createPool(vultisig: VultisigWhitelisted) {
    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractAt(IUniswapV3FactoryABI, FACTORY);
    const vultisigAddress = await vultisig.getAddress();
    const tx = await factory.createPool(USDC, vultisigAddress, FEE); // 1% fee
    await tx.wait();
    const poolAddress: string = await factory.getPool(USDC, vultisigAddress, FEE);
    // Initialize
    const poolContract = await ethers.getContractAt(IUniswapV3PoolABI, poolAddress);

    // USDC token 0, Vult token 1 as
    // 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 > 0x0D92d35D311E54aB8EEA0394d7E773Fc5144491a
    // Set initial price as 1 VULT = 0.01 USDC
    const txInitialize = await poolContract.initialize("79228162514264337593543950336");
    await txInitialize.wait();
    console.log({ poolAddress, USDC, vultisigAddress });
    // Add liquidity
    const nfpm = await ethers.getContractAt(NFPMABI, MANAGER, deployer);

    const mintParams = {
      token0: USDC,
      token1: vultisigAddress,
      fee: FEE,
      tickLower: -887220,
      tickUpper: 887220,
      amount0Desired: USDC_AMOUNT,
      amount1Desired: VULTISIG_AMOUNT,
      amount0Min: 0,
      amount1Min: 0,
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    };

    const mintTx = await nfpm.mint(mintParams, { gasLimit: 1000000 });
    console.log("--? minttx", mintTx);
    await mintTx.wait();
    console.log("Added liquidity");
    return poolAddress;
  }

  async function deployVultisigWhitelistedFixture() {
    const [owner, buyer, otherAccount] = await ethers.getSigners();

    const VultisigWhitelisted = await ethers.getContractFactory("VultisigWhitelisted");
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const vultisig = await VultisigWhitelisted.deploy();
    const whitelist = await Whitelist.deploy();

    await whitelist.setVultisig(vultisig);
    // await vultisig.setWhitelistContract(whitelist);

    // Transfer 100k USDC to owner address using impersonating account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    });
    const usdcWhale = await ethers.getSigner(USDC_WHALE);
    const usdc = await ethers.getContractAt(USDCABI, USDC, usdcWhale);
    const usdcOwner = await ethers.getContractAt(USDCABI, USDC, owner);
    const transferUSDCTx = await usdc.transfer(owner.address, 1000_000_000_000n); // 1M USDC transfer
    await transferUSDCTx.wait();
    // Approve token transer
    const vultisigApproveTx = await vultisig.approve(MANAGER, VULTISIG_AMOUNT);
    await vultisigApproveTx.wait();
    const usdcApproveTx = await usdcOwner.approve(MANAGER, USDC_AMOUNT);
    await usdcApproveTx.wait();

    // Check balance
    // console.log("--? USDC", await vultisig.balanceOf(owner), await usdc.balanceOf(owner));
    // console.log(
    //   "--? USDC",
    //   await vultisig.allowance(owner.address, MANAGER),
    //   await usdc.allowance(owner.address, MANAGER),
    // );
    // 100000000000000000000000000n 100000000000n
    // 1000000000000000000000000n   10000000000n
    // await hre.network.provider.request({
    //   method: "hardhat_stopImpersonatingAccount",
    //   params: [USDC_WHALE],
    // });

    const pool = await createPool(vultisig);
    return { vultisig, whitelist, owner, buyer, pool, otherAccount };
  }

  describe("Transfer", function () {
    it("Should transfer integration", async function () {
      const amount = ethers.parseEther("1000");
      const { vultisig, owner, otherAccount } = await loadFixture(deployVultisigWhitelistedFixture);
      expect(await vultisig.transfer(otherAccount.address, amount)).to.changeTokenBalances(
        vultisig,
        [owner.address, otherAccount.address],
        [-amount, amount],
      );
    });
  });
});
