// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    error NotWhitelisted();
    error NotVoltix();
    error MaxAddressCapOverflow();

    uint256 private _maxAddressCap;
    address private _voltix; // Voltix token contract address
    mapping(address => bool) private _isWhitelisted;
    mapping(address => uint256) private _contributed;

    constructor() {
        _maxAddressCap = 10_000 * 1e6; // USDC decimals 6
    }

    /**
     * @dev Check if called from voltix token contract.
     */
    modifier onlyVoltix() {
        if (_msgSender() != _voltix) {
            revert NotVoltix();
        }
        _;
    }

    function maxAddressCap() external view returns (uint256) {
        return _maxAddressCap;
    }

    function isWhitelisted(address account) external view returns (bool) {
        return _isWhitelisted[account];
    }

    function setMaxAddressCap(uint256 newCap) external onlyOwner {
        _maxAddressCap = newCap;
    }

    function setVoltix(address voltix) external onlyOwner {
        _voltix = voltix;
    }

    function addWhitelistedAddress(address whitelisted) external onlyOwner {
        _isWhitelisted[whitelisted] = true;
    }

    function addBatchWhitelist(address[] calldata whitelisted) external onlyOwner {
        for (uint i = 0; i < whitelisted.length; i++) {
            _isWhitelisted[whitelisted[i]] = true;
        }
    }

    function checkWhitelist(address to, uint256 amount) external onlyVoltix {
        if (!_isWhitelisted[to]) {
            revert NotWhitelisted();
        }

        if (_contributed[to] + amount > _maxAddressCap) {
            revert MaxAddressCapOverflow();
        }

        _contributed[to] += amount;
    }
}
