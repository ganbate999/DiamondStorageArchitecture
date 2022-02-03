// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {LibCFDiamond} from "../libraries/LibCFDiamond.sol";
import '../libraries/FundingUtils.sol';
import "../Swappable.sol";
import "../BondToken.sol";

contract BondfundingFacet is ReentrancyGuard, Swappable{
    using SafeMath for uint256;

    /**
     * ****************************************
     *
     * Events
     * ****************************************
     */
    event BCreatOffer(uint256 indexed offerId, address providerAddr, uint256 bondTokenAmt, address askCoinAddr, uint256 askCoinAmt);
    event BEditOffer(uint256 indexed offerId, uint256 bondTokenAmt, address askCoinAddr, uint256 askCoinAmt);
    event BDeleteOffer(uint256 indexed offerId);

    event BBuyOffer(uint256 indexed offerId, address buyerAddr, uint256 bondTokenAmt, address tCoinAddr, uint256 tCoinAmt);

    /**
    * ****************************************
    *
    * Functions
    * ****************************************
    */
    // Get Offer Data
    function getOffer(uint256 _offerId) external view returns(address, uint256, uint256, address, uint256, uint8){
        LibCFDiamond.OfferData storage od = LibCFDiamond.diamondStorage().bondOffersMap[_offerId];
        return (od.seller, od.bondTokenAmt, od.reserveBTAmt, od.askCoinAddr, od.askCoinAmt, od.status);
    }
    // Get BondToken
    function bondToken() external view returns(address){
        return LibCFDiamond.diamondStorage().bondToken;
    }
    // Get Bond Investors
    function totBInvestors() external view returns(uint256){
        return LibCFDiamond.diamondStorage().totBInvestors;
    }

    /// Create Offer
    /// @param _bondTokenAmt Offer BondToken Amount
    /// @param _askCoinAddr Offer Coin Address
    /// @param _askCoinAmt Offer Coin Amount
    function mCreateOffer(uint256 _bondTokenAmt, address _askCoinAddr, uint256 _askCoinAmt) external nonReentrant returns(uint256 offerId) {
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isActiveBondInv();
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.isOngoingCF();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(_bondTokenAmt > 0, "BF: INVALID_BT_AMOUNT");
        require(IBondToken(ds.bondToken).balanceOf(msg.sender) >= _bondTokenAmt, "BF: NOT_ENOUGH_BT");
        require(_askCoinAddr != address(0), "BF: INVALID_ADDRESSS");
        require(_askCoinAmt > 0, "BF: INVALID_COIN_AMOUNT");

        // Transfer BondToken from provider to contract
        IBondToken(ds.bondToken).transferFrom(msg.sender, address(this), _bondTokenAmt);

        offerId = ds.offersCounter;
        ds.bondOffersMap[offerId] = LibCFDiamond.OfferData({
            seller: msg.sender,
            bondTokenAmt: _bondTokenAmt,
            reserveBTAmt: _bondTokenAmt,
            askCoinAddr: _askCoinAddr,
            askCoinAmt: _askCoinAmt,
            status: LibCFDiamond.OFFER_STATUS_OPEN
        });

        ds.offersCounter += 1;
        emit BCreatOffer(offerId, msg.sender, _bondTokenAmt, _askCoinAddr, _askCoinAmt);
    }

    /// Edit Offer
    /// @param _offerId Offer Id
    /// @param _newBondTokenAmt Updating BondToken Amount
    /// @param _newAskCoinAddr Updating AskCoin Address
    /// @param _newAskCoinAmt Updating AskCoin Amount
    function mEditOffer(uint256 _offerId, uint256 _newBondTokenAmt, address _newAskCoinAddr, uint256 _newAskCoinAmt) external {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isOngoingCF();
        LibCFDiamond.isActiveBondInv();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();

        require(_newBondTokenAmt > 0, "BF: INVALID_BT_AMOUNT");
        require(ds.bondOffersMap[_offerId].seller == msg.sender, "BF: NOT_OWNER");
        require(ds.bondOffersMap[_offerId].status == LibCFDiamond.OFFER_STATUS_OPEN, "BF: NO_OFFER");
        require(_newAskCoinAddr != address(0), "BF: INVALID_ADDRESSS");
        require(_newAskCoinAmt > 0, "BF: INVALID_COIN_AMOUNT");

        // Check Already Sold BondToken
        require(ds.bondOffersMap[_offerId].bondTokenAmt == ds.bondOffersMap[_offerId].reserveBTAmt, "BF: ALREADY SOLD");

        // Check Whether old BondToken Amount is greater/less than origin Bond Token amount
        // Refund if the newBondToken < oldBondToken, or else transfer
        uint256 oldBondTokenAmt = ds.bondOffersMap[_offerId].bondTokenAmt;
        if(oldBondTokenAmt < _newBondTokenAmt){
            IBondToken(ds.bondToken).transferFrom(msg.sender, address(this), _newBondTokenAmt.sub(oldBondTokenAmt));
        } else if(oldBondTokenAmt > _newBondTokenAmt){
            IBondToken(ds.bondToken).transfer(msg.sender, oldBondTokenAmt.sub(_newBondTokenAmt));
        }

        // Update Offer Data
        ds.bondOffersMap[_offerId].reserveBTAmt = _newBondTokenAmt.add(ds.bondOffersMap[_offerId].reserveBTAmt).sub(ds.bondOffersMap[_offerId].bondTokenAmt);
        ds.bondOffersMap[_offerId].bondTokenAmt = _newBondTokenAmt;
        ds.bondOffersMap[_offerId].askCoinAddr = _newAskCoinAddr;
        ds.bondOffersMap[_offerId].askCoinAmt = _newAskCoinAmt;

        emit BEditOffer(_offerId, _newBondTokenAmt, _newAskCoinAddr, _newAskCoinAmt);
    }

    /// Delete Offer
    /// @param _offerId     Offer Id
    function mDeleteOffer(uint256 _offerId) external {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isActiveBondInv();

        LibCFDiamond.OfferData storage od = LibCFDiamond.diamondStorage().bondOffersMap[_offerId];
        require(od.seller == msg.sender, "BF: NOT_OWNER");
        require(od.status == LibCFDiamond.OFFER_STATUS_OPEN, "BF: NO_OFFER");
        require(od.bondTokenAmt == od.reserveBTAmt, "BF: ALREADY SOLD");

        // TODO Check
        delete LibCFDiamond.diamondStorage().bondOffersMap[_offerId];
        emit BDeleteOffer(_offerId);
    }

    /**
     * ****************************************
     *
     * Bond Investor roles
     * ****************************************
     */

    /// Buy Offer
    /// @notice
    /// @param _offerId Offer Id
    /// @param _tCoinAddr Investor`s Coin Address
    /// @param _tCoinAmt Investor`s Coin Amount
    function mBuyOffer(uint256 _offerId, uint256 _bondTokenAmt, address _tCoinAddr, uint256 _tCoinAmt) external {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isOngoingCF();
        LibCFDiamond.isActiveBondInv();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(ds.bondOffersMap[_offerId].status == LibCFDiamond.OFFER_STATUS_OPEN, "BF: NO_OFFER");
        require(_bondTokenAmt > 0, "BF: INVALID_BT_AMOUNT");
        require(ds.bondOffersMap[_offerId].reserveBTAmt >= _bondTokenAmt, "BF: NOT_ENOUGH_OFFER_BT");
        require(_tCoinAddr != address(0), "BF: INVALID_ADDRESSS");
        require(_tCoinAmt > 0, "BF: INVALID_COIN_AMOUNT");

        uint256 offerBTAmt = ds.bondOffersMap[_offerId].bondTokenAmt;
        address askCoinAddr = ds.bondOffersMap[_offerId].askCoinAddr;
        uint256 askCoinAmt = ds.bondOffersMap[_offerId].askCoinAmt;

        // Calculate required AskCoin amount from _bondTokenAmt
        uint256 reqAskCoinAmt = _bondTokenAmt.mul(askCoinAmt).div(offerBTAmt);

        // Apply Fee
        uint256 _feeAmt = _applyBondFee(askCoinAddr, askCoinAmt);

        // Check Transferred Coin Amount
        if(_tCoinAddr == askCoinAddr){
            // Check input amount
            require(reqAskCoinAmt.add(_feeAmt) <= _tCoinAmt, "BF: NOT_ENOUGH_COIN");
            // Transfer askCoin from buyer to seller
            IERC20(askCoinAddr).transferFrom(msg.sender, ds.bondOffersMap[_offerId].seller, reqAskCoinAmt);
        } else {
            reqAskCoinAmt = reqAskCoinAmt.add(_feeAmt);
            // Get DEX required input transferred Coin amount
            uint256 reqTCoinAmt = _getAmountInMax(_tCoinAddr, askCoinAddr, reqAskCoinAmt);
            // Check input amount
            require(reqTCoinAmt <= _tCoinAmt, "BF: NOT_ENOUGH_COIN");
            // Receive AskCoin from investor
            IERC20(_tCoinAddr).transferFrom(msg.sender, address(this), reqTCoinAmt);
            reqAskCoinAmt = _swap(_tCoinAddr, askCoinAddr, reqTCoinAmt);
            // Transfer askCoin from buyer to seller
            reqAskCoinAmt = reqAskCoinAmt.sub(_feeAmt);
            IERC20(askCoinAddr).transfer(ds.bondOffersMap[_offerId].seller, reqAskCoinAmt);
        }

        // Calculate BondToken Amount for providing to buyer
        // Send bond token to investor
        uint256 targetBTAmt = reqAskCoinAmt.mul(offerBTAmt).div(askCoinAmt);

        // Send BondToken to buyer
        IBondToken(ds.bondToken).transfer(msg.sender, targetBTAmt);
        // Update Offer`s Reserve Amount
        ds.bondOffersMap[_offerId].reserveBTAmt = ds.bondOffersMap[_offerId].reserveBTAmt.sub(targetBTAmt);
        emit BBuyOffer(_offerId, msg.sender, _bondTokenAmt, _tCoinAddr, _tCoinAmt);
    }

    /// Apply Project Owner Fee and Protocol Fee For Bond Investment
    function _applyBondFee(address _coinAddr, uint256 _coinAmt) internal returns (uint256 totalFee) {
        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        // Protocol Fee during investment
        uint256 _tFeeAmt = _coinAmt.mul(ds.PROTOCOL_FEE_PERCENT_2).div(LibCFDiamond.PERCENT_DIVISOR);

        // Project Owner Fee during investment
        uint256 _pFeeAmt = _coinAmt.mul(ds.PROJECT_FEE_PERCENT_2).div(LibCFDiamond.PERCENT_DIVISOR);
        uint256 tTotalFee = _tFeeAmt.add(_pFeeAmt);

        if(_coinAddr != ds.stableCoinAddress){
            totalFee = _swap(ds.stableCoinAddress, _coinAddr, tTotalFee);
        } else {
            totalFee = tTotalFee;
        }

        // Transfer stable coin fee to crowdfunding contract
        IERC20(ds.stableCoinAddress).transfer(ds.crowdFunding, totalFee);
        ds.projectFeeAmt = ds.projectFeeAmt.add(totalFee.mul(_pFeeAmt).div(tTotalFee));
        ds.protocolFeeAmt = ds.protocolFeeAmt.add(totalFee.mul(_tFeeAmt).div(tTotalFee));
    }
}
