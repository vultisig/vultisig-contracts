// const positionManager = (await ethers.getContractAt(
//   MANAGER_ABI,
//   UNISWAP[network].nfpm,
// )) as unknown as NonfungiblePositionManagerContract;
// const positionManagerAddress = await positionManager.getAddress();

//   // Approve the position manager to spend tokens
//   await vultisig.approve(positionManagerAddress, VULTISIG_AMOUNT);
//   await usdc.approve(positionManagerAddress, USDC_AMOUNT);

//   const slot = await pool.slot0();
//   const liquidity = await pool.liquidity();

//   const state = {
//     liquidity,
//     sqrtPriceX96: slot[0],
//     tick: slot[1],
//     observationIndex: slot[2],
//     observationCardinality: slot[3],
//     observationCardinalityNext: slot[4],
//     feeProtocol: slot[5],
//     unlocked: slot[6],
//   };

//   const Token0 = new Token(hre.network.config.chainId as number, token0, 6);
//   const Token1 = new Token(hre.network.config.chainId as number, token1, 18);

//   const configuredPool = new Pool(
//     Token0,
//     Token1,
//     FEE,
//     state.sqrtPriceX96.toString(),
//     state.liquidity.toString(),
//     Number(state.tick),
//   );

//   const position = Position.fromAmounts({
//     pool: configuredPool,
//     tickLower:
//       nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) - configuredPool.tickSpacing * 2,
//     tickUpper:
//       nearestUsableTick(configuredPool.tickCurrent, configuredPool.tickSpacing) + configuredPool.tickSpacing * 2,
//     amount0: USDC_AMOUNT.toString(),
//     amount1: VULTISIG_AMOUNT.toString(),
//     useFullPrecision: false,
//   });

//   const mintOptions = {
//     recipient: owner.address,
//     deadline: Math.floor(Date.now() / 1000) + 60 * 20,
//     slippageTolerance: new Percent(50, 10_000),
//   };

//   const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions);

//   const transaction = {
//     data: calldata,
//     to: positionManagerAddress,
//     value: value,
//     from: owner.address,
//     gasLimit: 10000000,
//   };
//   const txRes = await owner.sendTransaction(transaction);
//   await txRes.wait();

//   // Check pool balance
//   console.log("-> check liquidity", await usdc.balanceOf(poolAddress), await vultisig.balanceOf(poolAddress));
