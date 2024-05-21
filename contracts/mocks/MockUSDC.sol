// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/**
 * @title ERC20 used for Mock USDC testing
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(_msgSender(), 100_000_000 * 1e6);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
