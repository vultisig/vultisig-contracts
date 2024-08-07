// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20, ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC1363} from "erc-payable-token/contracts/token/ERC1363/ERC1363.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC20Burnable based token contract
 */
contract Token is ERC1363, Ownable {
    string private _name;
    string private _ticker;

    constructor() ERC20("", "") {
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
}
