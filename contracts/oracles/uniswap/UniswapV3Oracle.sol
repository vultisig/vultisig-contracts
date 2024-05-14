// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {OracleLibrary} from "./uniswapv0.8/OracleLibrary.sol";
import {IOracle} from "../../interfaces/IOracle.sol";

/**
 * @title UniswapV3Oracle
 * @notice For VLTI/USDC pool, it will return TWAP price for the last 30 mins and add 5% slippage
 * @dev This price will be used in whitelist contract to calculate the USDC tokenIn amount.
 * The actual amount could be different because, the ticks used at the time of purchase won't be the same as this TWAP
 */
contract UniswapV3Oracle is IOracle {
    /// @notice TWAP period
    uint32 public constant PERIOD = 30 minutes;
    /// @notice Will calculate 1 VLTI price in USDC
    uint128 public constant BASE_AMOUNT = 1e18; // VLTI has 18 decimals

    /// @notice VLTI/USDC pair
    address public immutable pool;
    /// @notice VLTI token address
    address public immutable baseToken;
    /// @notice USDC token address
    address public immutable USDC;

    constructor(address _pool, address _baseToken, address _USDC) {
        pool = _pool;
        baseToken = _baseToken;
        USDC = _USDC;
    }

    /// @notice Returns VLTI/USDC Univ3TWAP
    function name() external view returns (string memory) {
        return "VLTI/USDC Univ3TWAP";
    }

    /// @notice Returns TWAP price for 1 VLTI for the last 30 mins
    function peek(uint256 baseAmount) external view returns (uint256) {
        int24 tick = OracleLibrary.consult(pool, PERIOD);
        uint256 quotedUSDCAmount = OracleLibrary.getQuoteAtTick(tick, BASE_AMOUNT, baseToken, USDC);
        // Apply 5% slippage
        return (quotedUSDCAmount * baseAmount * 95) / 100;
    }
}
