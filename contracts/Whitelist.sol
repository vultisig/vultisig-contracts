// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOracle} from "./interfaces/IOracle.sol";

contract Whitelist is Ownable {
    error NotWhitelisted();
    error AlreadyContributed();
    error Locked();
    error NotVoltix();
    error SelfWhitelistDisabled();
    error MaxAddressCapOverflow();

    uint256 private _maxAddressCap;
    bool private _locked;
    bool private _isSelfWhitelistDisabled;
    address private _voltix; // Voltix token contract address
    address private _uniswapContract; // Uniswap address
    address private _oracle; // Uniswap v3 TWAP oracle
    mapping(address => bool) private _isWhitelisted;
    mapping(address => uint256) private _contributed;

    constructor() {
        _maxAddressCap = 10_000 * 1e6; // USDC decimals 6
        _locked = true; // Initially, liquidity will be locked
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

    receive() external payable {
        if (_isSelfWhitelistDisabled) {
            revert SelfWhitelistDisabled();
        }
        _isWhitelisted[_msgSender()] = true;
        payable(_msgSender()).transfer(msg.value);
    }

    function maxAddressCap() external view returns (uint256) {
        return _maxAddressCap;
    }

    function voltix() external view returns (address) {
        return _voltix;
    }

    function isWhitelisted(address account) external view returns (bool) {
        return _isWhitelisted[account];
    }

    function isSelfWhitelistDisabled() external view returns (bool) {
        return _isSelfWhitelistDisabled;
    }

    function uniswapContract() external view returns (address) {
        return _uniswapContract;
    }

    function oracle() external view returns (address) {
        return _oracle;
    }

    function contributed(address to) external view returns (uint256) {
        return _contributed[to];
    }

    function locked() external view returns (bool) {
        return _locked;
    }
    function setLocked(bool newLocked) external onlyOwner {
        _locked = newLocked;
    }

    function setMaxAddressCap(uint256 newCap) external onlyOwner {
        _maxAddressCap = newCap;
    }

    function setVoltix(address newVoltix) external onlyOwner {
        _voltix = newVoltix;
    }

    function setUniswapContract(address newUniswapContract) external onlyOwner {
        _uniswapContract = newUniswapContract;
    }

    function setIsSelfWhitelistDisabled(bool newFlag) external onlyOwner {
        _isSelfWhitelistDisabled = newFlag;
    }

    function setOracle(address _newOracle) external onlyOwner {
        _oracle = _newOracle;
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
        if (_locked) {
            revert Locked();
        }

        if (!_isWhitelisted[to]) {
            revert NotWhitelisted();
        }

        if (_contributed[to] > 0) {
            revert AlreadyContributed();
        }

        // Calculate rough USDC amount for VLTX amount
        uint256 estimatedUSDCAmount = IOracle(_oracle).peek(amount);
        if (estimatedUSDCAmount > _maxAddressCap) {
            revert MaxAddressCapOverflow();
        }

        _contributed[to] = estimatedUSDCAmount;
    }
}
