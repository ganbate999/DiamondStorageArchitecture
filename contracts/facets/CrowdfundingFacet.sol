// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {LibCFDiamond} from "../libraries/LibCFDiamond.sol";
import '../libraries/FundingUtils.sol';
import "../libraries/Strings.sol";
import "../interfaces/IBondToken.sol";
import "../ProjectToken.sol";
import "../BondToken.sol";
import "../Swappable.sol";

contract CrowdfundingFacet is ReentrancyGuard, Swappable{
    using SafeMath for uint256;
    using Strings for string;

    /**
        * ****************************************
        *
        * Events
        * ****************************************
        */
    // Set Project Owner Wallet Address
    event SetProjectOwnerAddr(address indexed walletAddress);
    // Investor Withdraw Fund
    event IInvest(address indexed investor, address indexed investToken, uint256 stableAmount, uint256 tokenAmount);
    // Investor Withdraw Fund
    event IWithdrawFund(address indexed investor, uint256 amount);
    // Investor ReClaim Fund
    event IReclaimFund(address indexed investor, uint256 amount);
    // Investor Claim Fund
    event IClaimFund(address indexed investor, uint256 amount);
    // Investor Claim Coin
    event IClaimCoin(address indexed investor, uint256 amount);
    // Bond Investor Claim Stable Coin
    event BIClaimFund(address indexed bInestor, uint256 btAmount, uint256 stAmount);
    // PT holder Claim Project Coin
    event WithdrawCoin(uint256 amount);
    // Project Owner Claim Fee
    event ClaimFees(uint256 amount);
    // Project Owner Claim Fund
    event ClaimFund(uint256 amount);
    // Claim Fees
    event TClaimFees(uint256 amount);

    /**
    * ****************************************
    *
    * Functions
    * ****************************************
    */

    function projectName() external view returns (string memory) {
        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        return ds._projectName;
    }

    function projectOwnerAddr() external view returns (address) {
        return LibCFDiamond.diamondStorage().projectOwnerAddr;
    }

    function projectToken() external view returns (address) {
        return LibCFDiamond.diamondStorage().projectToken;
    }

    function totPInvestors() external view returns (uint256) {
        return LibCFDiamond.diamondStorage().totPInvestors;
    }
    /**
     * ****************************************
     *
     * Public Functions
     * ****************************************
     */

    /// Set start timestamp of crowdfunding
    function setFundingDuration(uint256 _startTimestamp, uint256 _endTimestamp) external {
        LibCFDiamond.enforceIsContractOwner();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(ds.startTimestamp == 0 || block.timestamp < ds.startTimestamp, "CF: ALREADY_STARTED");
        require(_startTimestamp < _endTimestamp, "CF: START<END");

        ds.startTimestamp = _startTimestamp;
        ds.endTimestamp = _endTimestamp;
    }

    /// Set min. funding threshold
    function setMinFundingThreshold(uint256 _minFundingThreshold) external {
        LibCFDiamond.enforceIsContractOwner();

        require(_minFundingThreshold > 0, "CF: MIN>0");
        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        ds.minFundingThreshold = _minFundingThreshold;
    }

    /// Set Wallet Address fro Project fee
    function setProjectOwnerAddr(address _projectOwnerAddr) external {
        LibCFDiamond.enforceIsContractOwner();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        ds.projectOwnerAddr = _projectOwnerAddr;
        emit SetProjectOwnerAddr(_projectOwnerAddr);
    }

    /// Project Owner allocate Project Coin to this contract
    function allocateSupply(uint256 _amount) external nonReentrant {
        LibCFDiamond.enforceIsContractOwner();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        // Project owner sends project coins to funding contract
        IERC20(ds.coinAddress).transferFrom(msg.sender, address(this), _amount);
        ds.allocatedCoinAmt = ds.allocatedCoinAmt.add(_amount);
    }

    /// Get Token`s Buy Price
    /// @notice This depends on Bonding buy curve equation.
    function getBuyPrice(uint256 _investAmount) public view returns (uint256){
        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        // Price zero when project coins not supplied
        if(ds.allocatedCoinAmt == 0) return 0;
        //console.log('price calculation: %s %s', allocatedCoinAmt, totalStableCoinAmt + investAmount);
        return FundingUtils.calculatePrice(ds.allocatedCoinAmt, ds.totalCirculatingStableCoinAmt + _investAmount);
    }

    /// Get Token`s Sell Price
    /// @notice This depends on Bonding sell curve equation.
    /// @dev SELL_CURVE_COEFFICIENT * Buy Price
    function getSellPrice(uint256 _investAmount) public view returns (uint256){
        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        return FundingUtils.calculatePrice(ds.allocatedCoinAmt, ds.totalCirculatingStableCoinAmt + _investAmount).mul(ds.SELL_CURVE_COEFFICIENT_PERCENT).div(LibCFDiamond.PERCENT_DIVISOR);
    }

    /**
     * ****************************************
     *
     * Investor`s Roles
     * ****************************************
     */

    /// Invest
    /// @param _coinAddress Investing Coin`s Address
    /// @param _investAmt Investing StableCoin`s Amount
    function iinvest(address _coinAddress, uint256 _investAmt) external nonReentrant {
        LibCFDiamond.isOngoingCF();
        LibCFDiamond.isActiveCF();
        LibCFDiamond.whenNotPaused();

        require(_investAmt > 0, "CF: Coin is not enough");

        // Send StableCoin from investor to contract
        IERC20(_coinAddress).transferFrom(msg.sender, address(this), _investAmt);

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        // Swap from invest coin to stable coin
        uint256 investAmt = _investAmt;
        if(_coinAddress != ds.stableCoinAddress){
            investAmt = _swap(_coinAddress, ds.stableCoinAddress, investAmt);
        }

        // Apply Fee
        uint256 _feeAmt = LibCFDiamond._applyFee(investAmt);

        // Investing Amt
        uint256 investReserveAmt = investAmt.sub(_feeAmt);

        uint256 investPrice = getBuyPrice(investReserveAmt);
        // Not allow zero price because of too small invest amount
        require(investPrice > 0, "CF: TOO_SMALL_INVESTMENT");
        // Project Token Amount for providing to investor
        uint256 ptAmt = investReserveAmt.div(investPrice);
        //console.log('invest token price %s, project token', investPrice, ptAmt);

        // Set Total data
        ds.totalPTokenAmt = ds.totalPTokenAmt.add(ptAmt);
        ds.totalStableCoinAmt = ds.totalStableCoinAmt.add(investReserveAmt);
        ds.totalCirculatingStableCoinAmt = ds.totalCirculatingStableCoinAmt.add(investReserveAmt);

        // Set Map data
        if(ds.contributionsMap[msg.sender].tokenAmt == 0) {
            ds.totPInvestors++;
        }
        ds.contributionsMap[msg.sender].stableCoinAmt = ds.contributionsMap[msg.sender].stableCoinAmt.add(investReserveAmt);
        ds.contributionsMap[msg.sender].tokenAmt = ds.contributionsMap[msg.sender].tokenAmt.add(ptAmt);

        // Mint Project Token and Transfer to investor
        IProjectToken(ds.projectToken).mint(msg.sender, ptAmt);

        emit IInvest(msg.sender, _coinAddress, investAmt, ptAmt);
    }


    /// Withdraw
    /// @param _coinAddress Requiring coin address
    function iwithdrawFund(address _coinAddress) external nonReentrant {
        LibCFDiamond.isOngoingCF();
        LibCFDiamond.whenNotPaused();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        uint256 investorTokens = ds.contributionsMap[msg.sender].tokenAmt;
        require(investorTokens > 0, "CF: NO_FUND");
        uint256 stableCoinAmt = ds.contributionsMap[msg.sender].stableCoinAmt;

        // Burn Project Token
        IProjectToken(ds.projectToken).burnFrom(msg.sender, investorTokens);

        // Swap from stable coin to invest coin
        uint256 coinAmount = stableCoinAmt;
        if(_coinAddress != ds.stableCoinAddress){
            coinAmount = _swap(ds.stableCoinAddress, _coinAddress, stableCoinAmt);
        }

        // Return coins to investor
        IERC20(_coinAddress).transfer(msg.sender, coinAmount);

        // Reset Map Data
        ds.contributionsMap[msg.sender].tokenAmt = 0;
        ds.contributionsMap[msg.sender].stableCoinAmt = 0;

        // Set Total data
        ds.totalStableCoinAmt = ds.totalStableCoinAmt.sub(stableCoinAmt);
        // Circulating stableCoins
        ds.totalCirculatingStableCoinAmt = ds.totalCirculatingStableCoinAmt.add(stableCoinAmt);
        ds.totalPTokenAmt = ds.totalPTokenAmt.sub(investorTokens);

        emit IWithdrawFund(msg.sender, stableCoinAmt);
    }

    /// Reclaim
    /// @notice (when the min. funding threshold is NOT reached within the timeline)
    /// @param _coinAddress Requiring coin address
    function ireclaimFund(address _coinAddress) external nonReentrant {
        LibCFDiamond.isNotReachedToTh();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isEndOfCF();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        uint256 investorTokens = ds.contributionsMap[msg.sender].tokenAmt;
        require(investorTokens > 0, "CF: NO_FUND");
        uint256 stableCoinAmt = ds.contributionsMap[msg.sender].stableCoinAmt;

        // Burn Project Token
        IProjectToken(ds.projectToken).burnFrom(msg.sender, investorTokens);

        // Swap from stable coin to invest coin
        uint256 coinAmount = stableCoinAmt;
        if(_coinAddress != ds.stableCoinAddress){
            coinAmount = _swap(ds.stableCoinAddress, _coinAddress, stableCoinAmt);
        }
        // Return StableCoin to investor
        IERC20(_coinAddress).transfer(msg.sender, coinAmount);

        // Reset Map Data
        ds.contributionsMap[msg.sender].tokenAmt = 0;
        ds.contributionsMap[msg.sender].stableCoinAmt = 0;
        ds.totPInvestors--;

        emit IReclaimFund(msg.sender, stableCoinAmt);
    }

    /// Claim
    /// @notice (when the min. funding threshold is reached within the timeline)
    function iclaimCoin() external nonReentrant {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isEndOfCF();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        uint256 investorTokens = ds.contributionsMap[msg.sender].tokenAmt;
        require(investorTokens > 0, "CF: NO_FUND");

        // Project Tokens => Project Coin
        uint256 coinAmount = ds.allocatedCoinAmt.mul(investorTokens).div(ds.totalPTokenAmt);

        // Burn Project Token
        IProjectToken(ds.projectToken).burnFrom(msg.sender, investorTokens);

        // Send Project Coin to investor
        IERC20(ds.coinAddress).transfer(msg.sender, coinAmount);

        // Reset Map Data
        ds.contributionsMap[msg.sender].tokenAmt = 0;
        ds.contributionsMap[msg.sender].stableCoinAmt = 0;

        emit IClaimCoin(msg.sender, coinAmount);
    }

    /// Claim Funds in Bond Investment
    function biclaimFund() external {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isEndOfCF();
        LibCFDiamond.isActiveBondInv();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();

        uint256 balance = IBondToken(ds.bondToken).balanceOf(msg.sender);
        require( balance > 0, "CF: NO_BOND_BALANCE");

        // Burn Bond Token
        IBondToken(ds.bondToken).burnFrom(msg.sender, balance);

        // Calculate Invested Stable Coin Amount
        uint256 investedAmount = ds.totalStableCoinAmt.mul(balance).div(IBondToken(ds.bondToken).totalSupply());
        IERC20(ds.stableCoinAddress).transfer(msg.sender, investedAmount);

        emit BIClaimFund(msg.sender, balance, investedAmount);
    }

    /**
     * ****************************************
     *
     * Project Owner`s Roles
     * ****************************************
     */

    /// Withdraw
    /// @notice (when the min. funding threshold is NOT reached within the timeline.)
    function withdrawCoin() external nonReentrant {
        LibCFDiamond.isNotReachedToTh();
        LibCFDiamond.enforceIsContractOwner();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isEndOfCF();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(ds.allocatedCoinAmt > 0, "CF: NO_COIN");

        uint256 withdrawAmount = ds.allocatedCoinAmt;
        IERC20(ds.coinAddress).transfer(msg.sender, withdrawAmount);
        ds.allocatedCoinAmt = 0;

        emit WithdrawCoin(withdrawAmount);
    }

    /// Claim Fee
    /// @notice (when the min. funding threshold is reached within the timeline)
    function claimFees() external nonReentrant {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.enforceIsContractOwner();
        LibCFDiamond.whenNotPaused();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(ds.projectOwnerAddr != address(0), "CF: ZERO_ADDRESS");

        uint256 feeAmount = ds.projectFeeAmt;
        require(feeAmount > 0, "CF: NO_FEE");

        IERC20(ds.stableCoinAddress).transfer(ds.projectOwnerAddr, feeAmount);
        ds.projectFeeAmt = 0;

        emit ClaimFees(feeAmount);
    }

    /// Claim Fund
    /// @notice (when the min. funding threshold is reached within the timeline)
    function claimFund() external nonReentrant {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.enforceIsContractOwner();
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isEndOfCF();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(ds.projectOwnerAddr != address(0), "CF: ZERO_ADDRESS");
        require(ds.totalStableCoinAmt > 0, "CF: NO_AMOUNT");

        uint256 claimAmount = ds.totalStableCoinAmt;

        IERC20(ds.stableCoinAddress).transfer(ds.projectOwnerAddr, claimAmount);

        ds.totalStableCoinAmt = 0;
        ds.minFundingThreshold = 0;

        emit ClaimFund(claimAmount);
    }


    /**
     * ****************************************
     *
     * Protocol owner roles
     * ****************************************
     */

    function tclaimFees() external nonReentrant {
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.whenNotPaused();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(msg.sender == ds.treasuryAddress, "CF: NOT_ALLOWED");
        require(ds.protocolFeeAmt > 0, "CF: NO_FEE");

        uint256 feeAmount = ds.protocolFeeAmt;
        IERC20(ds.stableCoinAddress).transfer(ds.treasuryAddress, feeAmount);
        ds.protocolFeeAmt = 0;

        emit TClaimFees(feeAmount);
    }

    /**
     * ****************************************
     *
     * Bond Investment
     * ****************************************
     */
    /// Bond Investment
    /// @notice (after the min. funding threshold is reached within the timeline)
    /// @param _bPOFeePt Project Owner`s Fee Percent For Bond Investment
    function launchBondInv(uint16 _bPOFeePt) external nonReentrant {
        LibCFDiamond.whenNotPaused();
        LibCFDiamond.isReachedToTh();
        LibCFDiamond.isOngoingCF();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        require(_bPOFeePt < 10000, "BF: INVALID_PERCENT");

        ds.PROJECT_FEE_PERCENT_2 = _bPOFeePt;

        /// Deploy Bond Token
        /// Name: "BOND_" + Project Name
        /// Symbol: Prefix (T) + Project Name (Max 4 letters) + Suffix (BT)
        /// Fixed Supply: 100,000 * DECIMALS
        /// Owner: Project Owner
        string memory tokenName = string("BOND_").append(ds._projectName);
        string memory tokenSymbol = string("T").append(ds._projectName.slice(0, 4)).append(string("BT"));
        ds.bondToken = address(new BondToken(tokenName, tokenSymbol, 1e23, msg.sender));
        ds.crowdFunding = address(this);
    }
}
