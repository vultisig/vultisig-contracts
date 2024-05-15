// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC777} from "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC777 based Vultisig token contract
 */
contract Vultisig is ERC777, Ownable {
    constructor(address[] memory _defaultOperators) ERC777("Vultisig Token", "VULT", _defaultOperators) {
        _mint(_msgSender(), 100_000_000 * 1e18, "", "");
    }
}
