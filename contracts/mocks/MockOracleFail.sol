// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IOracle} from "../interfaces/IOracle.sol";

contract MockOracleFail is IOracle {
    function name() external view returns (string memory) {
        return "VLTX/USDC Univ3TWAP";
    }

    function peek(uint256 baseAmount) external view returns (uint256) {
        return 10_000 * 1e6 + 1;
    }
}
