//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./interfaces/IDex.sol";

abstract contract Swappable {

    // Address of the uniswap v2 router
    address private constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    // Address of WETH token
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /// @notice this swap function is used to trade from one token to another
    /// @param _tokenIn the token address you want to trade out of
    /// @param _tokenOut = the token address you want as the output of this trade
    /// @param _amountIn = the amount of tokens you are sending in
    function _swap(address _tokenIn, address _tokenOut, uint256 _amountIn) internal returns(uint256 amountOutMin){

        //next we need to allow the uniswapv2 router to spend the token we just sent to this contract
        //by calling IERC20 approve you allow the uniswap contract to spend the tokens in this contract
        IERC20(_tokenIn).approve(UNISWAP_V2_ROUTER, _amountIn);

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        // Get Min output amount
        amountOutMin = _getAmountOutMin(_tokenIn, _tokenOut, _amountIn);

        //then we will call swapExactTokensForTokens
        //for the deadline we will pass in block.timestamp
        //the deadline is the latest time the trade is valid for
        IDex(UNISWAP_V2_ROUTER).swapExactTokensForTokens(_amountIn, amountOutMin, path, address(this), block.timestamp);
    }

    /// @notice This function will return the minimum amount from a swap
    /// @dev Input the 3 parameters below and it will return the minimum amount out
    /// @param _tokenIn the token address you want to trade out of
    /// @param _tokenOut = the token address you want as the output of this trade
    /// @param _amountIn = the amount of tokens you are sending in
    function _getAmountOutMin(address _tokenIn, address _tokenOut, uint256 _amountIn) internal view returns (uint256) {

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        uint256[] memory amountOuts = IDex(UNISWAP_V2_ROUTER).getAmountsOut(_amountIn, path);
        return amountOuts[path.length -1];
    }
    /// @notice This function will return the maximum amount from a swap
    /// @dev Input the 3 parameters below and it will return the minimum amount out
    /// @param _tokenIn the token address you want to trade out of
    /// @param _tokenOut = the token address you want as the output of this trade
    /// @param _amountOut = the amount of tokens you will be received
    function _getAmountInMax(address _tokenIn, address _tokenOut, uint256 _amountOut) internal view returns (uint256) {

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        uint256[] memory amountOuts = IDex(UNISWAP_V2_ROUTER).getAmountsIn(_amountOut, path);
        return amountOuts[0];
    }
}
