//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./SafeMath.sol";

/// @title Bonding Curve Algorithm
/// @author abhi3700, hosokawa-zen
library FundingUtils {
    using SafeMath for uint256;

    /// @notice Calculate Token Price with Bonding Curve Algorithm
    /// @dev
    /// RESERVE_RATIO = 0.3
    /// N = (1/RESERVE_RATIO) - 1
    /// S Supply
    /// X Circulating Market Supply
    /// P Token Price 50
    /// Price = (P / S ^ N) * X ^ N
    function calculatePrice(uint256 fundingSupply, uint256 currentSupply) internal pure returns (uint256) {
        uint256 price = uint256(50).mul(currentSupply).mul(currentSupply).mul(nthRoot(currentSupply, 3, 8, 20));
        price = price.div(fundingSupply).div(fundingSupply).div(nthRoot(fundingSupply, 3, 8, 20));
        return price;
    }

    /// @notice calculates a^(1/n) to dp decimal places
    /// @dev maxIts bounds the number of iterations performed
    /// @param _a Number
    /// @param _n Exponent`s divider
    /// @param _dp Decimal places
    /// @param _maxIts Bounds the number of iterations performed
    function nthRoot(uint256 _a, uint256 _n, uint256 _dp, uint256 _maxIts) internal pure returns(uint256) {
        assert (_n > 1);

        // The scale factor is a crude way to turn everything into integer calcs.
        // Actually do (a * (10 ^ ((dp + 1) * n))) ^ (1/n)
        // We calculate to one extra dp and round at the end
        uint256 one = 10 ** (1 + _dp);
        uint256 a0 = one ** _n * _a;

        // Initial guess: 1.0
        uint256 xNew = one;

        uint256 iter = 0;
        uint256 x = 0;
        while (xNew != x && iter < _maxIts) {
            x = xNew;
            uint256 t0 = x ** (_n - 1);
            if (x * t0 > a0) {
                xNew = x - (x - a0 / t0) / _n;
            } else {
                xNew = x + (a0 / t0 - x) / _n;
            }
            ++iter;
        }

        // Round to nearest in the last dp.
        return (xNew + 5) / 10;
    }
}
