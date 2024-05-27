import fs from "fs";
import hre, { ethers } from "hardhat";
import { abi as FACTORY_ABI } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json";
import { encodeSqrtRatioX96 } from "@uniswap/v3-sdk";
import { UniswapV3Factory } from "../typechain-types";
import { UNISWAP, USDC } from "./consts";

const FEE = 10000; // 1% fee

async function main() {
  const network = hre.network.name as "mainnet" | "sepolia";

  const VultisigWhitelisted = await ethers.getContractFactory("VultisigWhitelisted");
  const Whitelist = await ethers.getContractFactory("Whitelist");

  const vultisig = await VultisigWhitelisted.deploy();
  await vultisig.waitForDeployment();

  const whitelist = await Whitelist.deploy();
  await whitelist.waitForDeployment();

  await whitelist.setVultisig(vultisig);
  await vultisig.setWhitelistContract(whitelist);

  const factory = (await ethers.getContractAt(FACTORY_ABI, UNISWAP[network].factory)) as unknown as UniswapV3Factory;

  const usdc = await ethers.getContractAt("MockUSDC", USDC[network]);
  // Create the pool
  const token0 = await usdc.getAddress();
  const token1 = await vultisig.getAddress();

  const createPoolTx = await factory.createPool(token0, token1, FEE);
  await createPoolTx.wait();

  const poolAddress = await factory.getPool(token0, token1, FEE);
  console.log({ poolAddress });

  await whitelist.setPool(poolAddress);

  // Initialize the pool - using 0.01 initial price
  const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);
  await pool.initialize(
    encodeSqrtRatioX96(ethers.parseUnits("100", 18).toString(), ethers.parseUnits("1", 6).toString()).toString(),
  );

  // Deploy uniswap v3 oracle
  const OracleFactory = await ethers.getContractFactory("UniswapV3Oracle");
  const oracle = await OracleFactory.deploy(poolAddress, token1, token0);
  await oracle.waitForDeployment();

  const priceTx = await pool.increaseObservationCardinalityNext(10);
  await priceTx.wait();

  await whitelist.setOracle(oracle);

  const deployedContracts = {
    vultisig: await vultisig.getAddress(),
    whitelist: await whitelist.getAddress(),
    poolAddress,
    oracle: await oracle.getAddress(),
  };

  fs.writeFileSync(`./deployment-${network}.json`, JSON.stringify(deployedContracts));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
