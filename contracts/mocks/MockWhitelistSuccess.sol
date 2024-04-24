// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IWhitelist} from "../interfaces/IWhitelist.sol";

contract MockWhitelistSuccess is IWhitelist {
    function checkWhitelist(address sender, uint256 amount) external {}
}
