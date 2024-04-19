// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWhitelist {
    function checkWhitelist(address sender, uint256 amount) external;
}
