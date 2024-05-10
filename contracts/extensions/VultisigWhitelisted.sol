// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Vultisig} from "../Vultisig.sol";
import {IWhitelist} from "../interfaces/IWhitelist.sol";

contract VultisigWhitelisted is Vultisig {
    address private _whitelistContract;

    constructor(address[] memory _defaultOperators) Vultisig(_defaultOperators) {}

    function whitelistContract() external view returns (address) {
        return _whitelistContract;
    }

    function setWhitelistContract(address newWhitelistContract) external onlyOwner {
        _whitelistContract = newWhitelistContract;
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256 amount) internal override {
        if (_whitelistContract != address(0)) {
            IWhitelist(_whitelistContract).checkWhitelist(to, amount);
        }
        super._beforeTokenTransfer(operator, from, to, amount);
    }
}
