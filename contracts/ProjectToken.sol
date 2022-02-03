//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/SafeMath.sol";
import "./interfaces/IProjectToken.sol";

contract ProjectToken is IProjectToken, Ownable {
    using SafeMath for uint256;

    string private _name;
    string private _symbol;
    uint8 internal constant _decimals = 18;
    uint256  internal _total_supply;
    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) internal _allowances;

    constructor(string memory _tName, string memory _tSymbol){
        _name = _tName;
        _symbol = _tSymbol;
    }

    function name() external view virtual override returns (string memory) {
        return _name;
    }

    function symbol() external view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() external view virtual override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view virtual override returns (uint256) {
        return _total_supply;
    }

    function balanceOf(address account) external view override returns (uint256){
        return _balances[account];
    }

    function allowance(address owner, address spender) external view override returns (uint256){
        return _allowances[owner][spender];
    }

    function _mint(address to, uint256 value) internal {
        _total_supply = _total_supply.add(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        _balances[from] = _balances[from].sub(value);
        _total_supply = _total_supply.sub(value);
        emit Transfer(from, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) private {
        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function _transfer(address from, address to, uint256 value) private {
        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(from, to, value);
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external override onlyOwner returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external override onlyOwner returns (bool) {
        if (_allowances[from][msg.sender] != type(uint256).max) {
            _allowances[from][msg.sender] = _allowances[from][msg.sender].sub(value);
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external override onlyOwner {
        require(amount > 0, "ERC20: mint amount zero");
        _mint(to, amount);
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) external override onlyOwner {
        require(amount > 0, "ERC20: burn amount zero");
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * _allowances.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have _allowances for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) external override onlyOwner {
        uint256 currentAllowance = _allowances[account][_msgSender()];
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
    }
}
