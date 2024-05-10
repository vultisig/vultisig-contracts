// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOracle} from "./interfaces/IOracle.sol";

contract Whitelist is Ownable {
    error NotWhitelisted();
    error AlreadyContributed();
    error Locked();
    error NotVultisig();
    error SelfWhitelistDisabled();
    error Blacklisted();
    error MaxAddressCapOverflow();

    uint256 private _maxAddressCap;
    bool private _locked;
    bool private _isSelfWhitelistDisabled;
    address private _vultisig; // Vultisig token contract address
    address private _uniswapContract; // Uniswap address
    address private _oracle; // Uniswap v3 TWAP oracle
    mapping(address => bool) private _isBlacklisted;
    mapping(address => bool) private _isWhitelisted;
    mapping(address => uint256) private _contributed;

    /// @notice Set the default max address cap to 10k USDC and lock token transfers initially
    constructor() {
        _maxAddressCap = 10_000 * 1e6; // USDC decimals 6
        _locked = true; // Initially, liquidity will be locked
    }

    /// @notice Check if called from vultisig token contract.
    modifier onlyVultisig() {
        if (_msgSender() != _vultisig) {
            revert NotVultisig();
        }
        _;
    }

    /// @notice Self-whitelist using ETH transfer
    /// @dev reverts if whitelist is disabled
    /// @dev reverts if address is already blacklisted
    /// @dev ETH will be sent back to the sender
    receive() external payable {
        if (_isSelfWhitelistDisabled) {
            revert SelfWhitelistDisabled();
        }
        if (_isBlacklisted[_msgSender()]) {
            revert Blacklisted();
        }
        _isWhitelisted[_msgSender()] = true;
        payable(_msgSender()).transfer(msg.value);
    }

    /// @notice Returns max address cap
    function maxAddressCap() external view returns (uint256) {
        return _maxAddressCap;
    }

    /// @notice Returns
    function vultisig() external view returns (address) {
        return _vultisig;
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

    function setVultisig(address newVultisig) external onlyOwner {
        _vultisig = newVultisig;
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

    function setBlacklisted(address blacklisted, bool flag) external onlyOwner {
        _isBlacklisted[blacklisted] = flag;
    }

    function checkWhitelist(address to, uint256 amount) external onlyVultisig {
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
