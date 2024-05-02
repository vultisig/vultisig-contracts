// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {OracleLibrary} from "./uniswapv0.8/OracleLibrary.sol";
import {IOracle} from "../../interfaces/IOracle.sol";

/**
 * @title UniswapV3Oracle
 */
contract UniswapV3Oracle is IOracle {
    address public immutable pool; // VLTX/USDC pair
    address public immutable baseToken; // VLTX
    address public immutable USDC;
    uint32 public constant PERIOD = 30 minutes;
    uint128 public constant BASE_AMOUNT = 1e18; // VLTX has 18 decimals

    constructor(address _pool, address _baseToken, address _USDC) {
        pool = _pool;
        baseToken = _baseToken;
        USDC = _USDC;
    }

    function name() external view returns (string memory) {
        return "VLTX/USDC Univ3TWAP";
    }

    function peek(uint256 baseAmount) external view returns (uint256) {
        int24 tick = OracleLibrary.consult(pool, PERIOD);
        uint256 quotedUSDCAmount = OracleLibrary.getQuoteAtTick(tick, BASE_AMOUNT, baseToken, USDC);
        // Apply 5% slippage
        return (quotedUSDCAmount * baseAmount * 95) / 100;
    }
}
