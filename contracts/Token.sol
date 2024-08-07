// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC1363, IERC165} from "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";
import {Ownable, OFTCore} from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFTCore.sol";

/**
 * @title ERC20Burnable based token contract
 */
contract Token is ERC1363, OFTCore {
    string private _name;
    string private _ticker;

    constructor(address _lzEndpoint) ERC20("", "") OFTCore(_lzEndpoint) {
        _mint(_msgSender(), 100_000_000_000 * 1e18);
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function mint(uint256 amount) external onlyOwner {
        _mint(_msgSender(), amount);
    }

    function setNameAndTicker(string calldata name_, string calldata ticker_) external onlyOwner {
        _name = name_;
        _ticker = ticker_;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _ticker;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1363, OFTCore) returns (bool) {
        return
            interfaceId == type(OFTCore).interfaceId ||
            interfaceId == type(IERC20).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function token() public view virtual override returns (address) {
        return address(this);
    }

    function circulatingSupply() public view virtual override returns (uint) {
        return totalSupply();
    }

    function _debitFrom(address _from, uint16, bytes memory, uint _amount) internal virtual override returns (uint) {
        address spender = _msgSender();
        if (_from != spender) _spendAllowance(_from, spender, _amount);
        _burn(_from, _amount);
        return _amount;
    }

    function _creditTo(uint16, address _toAddress, uint _amount) internal virtual override returns (uint) {
        _mint(_toAddress, _amount);
        return _amount;
    }
}
