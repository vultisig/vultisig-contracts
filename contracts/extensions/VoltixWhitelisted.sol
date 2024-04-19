// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Voltix} from "../Voltix.sol";
import {IWhitelist} from "../interfaces/IWhitelist.sol";

contract VoltixWhitelisted is Voltix {
    bool private _isLaunchPeriod;
    address private _whitelistContract;

    constructor(address[] memory _defaultOperators) Voltix(_defaultOperators) {}

    function isLaunchPeriod() external view returns (bool) {
        return _isLaunchPeriod;
    }

    function whitelistContract() external view returns (address) {
        return _whitelistContract;
    }

    function setIsLaunchPeriod(bool isLaunchPeriod) external onlyOwner {
        _isLaunchPeriod = isLaunchPeriod;
    }

    function setWhitelistContract(address whitelistContract) external onlyOwner {
        _whitelistContract = whitelistContract;
    }

    function _checkWhitelist(address to, uint256 amount) internal {
        IWhitelist(_whitelistContract).checkWhitelist(to, amount);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256 amount) internal override {
        if (_isLaunchPeriod) {
            _checkWhitelist(to, amount);
        }
        super._beforeTokenTransfer(operator, from, to, amount);
    }
}
