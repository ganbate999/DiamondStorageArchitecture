// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
/******************************************************************************/
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import "../libraries/Strings.sol";
import "./SafeMath.sol";
import "../ProjectToken.sol";
import "hardhat/console.sol";

library LibCFDiamond {
    using SafeMath for uint256;
    using Strings for string;

    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");

    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors array
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        uint256 facetAddressPosition; // position of facetAddress in facetAddresses array
    }

    // Funding Data Structure For Every Investor
    struct FundData {
        uint256 tokenAmt;
        uint256 stableCoinAmt;
    }

    // Offer Data for Bond Investment
    struct OfferData {
        address seller;
        uint256 bondTokenAmt;
        uint256 reserveBTAmt;
        address askCoinAddr;
        uint256 askCoinAmt;
        uint8 status;
    }

    struct DiamondStorage {
        // maps function selector to the facet address and
        // the position of the selector in the facetFunctionSelectors.selectors array
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        // maps facet addresses to function selectors
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        // facet addresses
        address[] facetAddresses;
        // Used to query if a contract implements an interface.
        // Used to implement ERC-165.
        mapping(bytes4 => bool) supportedInterfaces;
        // owner of the contract
        address contractOwner;
        // paused of the contract
        bool _paused;

        /// Project name
        string _projectName;
        /// Mapping of investor`s address => FundData
        mapping(address => FundData) contributionsMap;
        /// Total bought project tokens
        uint256 totalPTokenAmt;
        /// Total deposited stableCoins
        uint256 totalStableCoinAmt;
        /// Total circulating stableCoins
        uint256 totalCirculatingStableCoinAmt;

        /// coin`s address => Project Fee Amount
        uint256 projectFeeAmt;
        /// coin`s address => Protocol Fee Amount
        uint256 protocolFeeAmt;

        // Project Token
        address projectToken;

        // Address of the deployed Project Coin contract
        address coinAddress;
        // Funding Project Coin`s Supply Amount
        uint256 allocatedCoinAmt;

        // Address of secure wallet to send crowdfund contributions to
        address projectOwnerAddr;
        // THEIA treasury address
        address treasuryAddress;

        // MIN. Funding Threshold
        uint256 minFundingThreshold;
        // GMT timestamp of when the crowdfund starts
        uint256 startTimestamp;
        // GMT timestamp of when the crowdfund ends
        uint256 endTimestamp;

        // USDT, USDC
        address stableCoinAddress;
        // Protocol Fee Percent In Funding (1%)
        uint16 PROTOCOL_FEE_PERCENT_1;

        // Project Owner Fee Percent
        uint16 PROJECT_FEE_PERCENT_1;

        // Sell price coefficient (0.9)
        uint16 SELL_CURVE_COEFFICIENT_PERCENT;

        // Crowdfunding Contract
        address crowdFunding;

        /// Mapping of offer_id => OfferData
        mapping(uint256 => OfferData) bondOffersMap;
        /// Bond Offer Iterator
        uint256 offersCounter;

        // Bond Token
        address bondToken;

        // Protocol Fee Percent In Bond Investment (1%)
        uint16 PROTOCOL_FEE_PERCENT_2;
        // Bond Investment Project Owner Fee Percent
        uint16 PROJECT_FEE_PERCENT_2;

        // Total Crowdfunding Investors
        uint256 totPInvestors;
        // Total Bond funding Investors
        uint256 totBInvestors;
        // TODO Please add new members from end of struct
    }

    // Percent Division
    uint16 internal constant PERCENT_DIVISOR = 10 ** 4;

    // Offer Status Open
    uint8 internal constant OFFER_STATUS_OPEN = 1;
    uint8 internal constant OFFER_STATUS_CLOSE = 0;

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setContractOwner(address _newOwner) internal {
        DiamondStorage storage ds = diamondStorage();
        address previousOwner = ds.contractOwner;
        ds.contractOwner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    function contractOwner() internal view returns (address contractOwner_) {
        contractOwner_ = diamondStorage().contractOwner;
    }

    function enforceIsContractOwner() internal view {
        require(msg.sender == diamondStorage().contractOwner, "LibDiamond: Must be contract owner");
    }

    // The contract must be paused.
    function whenPaused() internal view {
        require(diamondStorage()._paused, "Pausable: not paused");
    }

    // The contract must not be paused.
    function whenNotPaused() internal view {
        require(!diamondStorage()._paused, "Pausable: paused");
    }

    event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata);

    // Internal function version of diamondCut
    function diamondCut(
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) internal {
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
            if (action == IDiamondCut.FacetCutAction.Add) {
                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Replace) {
                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Remove) {
                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else {
                revert("LibDiamondCut: Incorrect FacetCutAction");
            }
        }
        emit DiamondCut(_diamondCut, _init, _calldata);
        initializeDiamondCut(_init, _calldata);
    }

    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();        
        require(_facetAddress != address(0), "LibDiamondCut: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        // add new facet address if it does not exist
        if (selectorPosition == 0) {
            addFacet(ds, _facetAddress);            
        }
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress == address(0), "LibDiamondCut: Can't add function that already exists");
            addFunction(ds, selector, selectorPosition, _facetAddress);
            selectorPosition++;
        }
    }

    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();
        require(_facetAddress != address(0), "LibDiamondCut: Add facet can't be address(0)");
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        // add new facet address if it does not exist
        if (selectorPosition == 0) {
            addFacet(ds, _facetAddress);
        }
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            require(oldFacetAddress != _facetAddress, "LibDiamondCut: Can't replace function with same function");
            removeFunction(ds, oldFacetAddress, selector);
            addFunction(ds, selector, selectorPosition, _facetAddress);
            selectorPosition++;
        }
    }

    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        require(_functionSelectors.length > 0, "LibDiamondCut: No selectors in facet to cut");
        DiamondStorage storage ds = diamondStorage();
        // if function does not exist then do nothing and return
        require(_facetAddress == address(0), "LibDiamondCut: Remove facet address must be address(0)");
        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            removeFunction(ds, oldFacetAddress, selector);
        }
    }

    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {
        enforceHasContractCode(_facetAddress, "LibDiamondCut: New facet has no code");
        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;
        ds.facetAddresses.push(_facetAddress);
    }    


    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress) internal {
        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);
        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;
    }

    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {        
        require(_facetAddress != address(0), "LibDiamondCut: Can't remove function that doesn't exist");
        // an immutable function is a function defined directly in a diamond
        require(_facetAddress != address(this), "LibDiamondCut: Can't remove immutable function");
        // replace selector with last selector, then delete last selector
        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;
        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;
        // if not the same then replace _selector with lastSelector
        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];
            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;
            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
        }
        // delete the last selector
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();
        delete ds.selectorToFacetAndPosition[_selector];

        // if no more selectors for facet address then delete the facet address
        if (lastSelectorPosition == 0) {
            // replace facet address with last facet address and delete last facet address
            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;
            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
            if (facetAddressPosition != lastFacetAddressPosition) {
                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];
                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;
                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;
            }
            ds.facetAddresses.pop();
            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
        }
    }

    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        if (_init == address(0)) {
            require(_calldata.length == 0, "LibDiamondCut: _init is address(0) but_calldata is not empty");
        } else {
            require(_calldata.length > 0, "LibDiamondCut: _calldata is empty but _init is not address(0)");
            if (_init != address(this)) {
                enforceHasContractCode(_init, "LibDiamondCut: _init address has no code");
            }
            (bool success, bytes memory error) = _init.delegatecall(_calldata);
            if (!success) {
                if (error.length > 0) {
                    // bubble up the error
                    revert(string(error));
                } else {
                    revert("LibDiamondCut: _init function reverted");
                }
            }
        }
    }

    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 contractSize;
        assembly {
            contractSize := extcodesize(_contract)
        }
        require(contractSize > 0, _errorMessage);
    }

    /**
    * ****************************************
    *
    * Modifiers
    * ****************************************
    */
    // Ensure actions can only happen while crowdfund is ongoing
    function isOngoingCF() internal view {
        DiamondStorage storage ds = diamondStorage();
        require(block.timestamp >= ds.startTimestamp && block.timestamp < ds.endTimestamp, "CF: NOT_ONGOING");
    }

    // Crowdfunding is active when project owner sends enough project coins to funding contracts
    function isActiveCF() internal view {
        require(diamondStorage().allocatedCoinAmt > 0, "CF: PC_NOT_ENOUGH");
    }

    // Ensure actions can only happen when funding threshold is reached
    function isReachedToTh() internal view {
        DiamondStorage storage ds = diamondStorage();
        require(ds.totalStableCoinAmt >= ds.minFundingThreshold, "CF: NOT_REACHED_MIN_THRESHOLD");
    }

    // Ensure actions can only happen when funding threshold is not reached
    function isNotReachedToTh() internal view {
        DiamondStorage storage ds = diamondStorage();
        require(ds.totalStableCoinAmt < ds.minFundingThreshold, "CF: REACHED_MIN_THRESHOLD");
    }

    function isEndOfCF() internal view {
        require(block.timestamp >= diamondStorage().endTimestamp, "CF: NOT_ENDED");
    }

    function isActiveBondInv() internal view {
        require(diamondStorage().bondToken != address(0), "CF: BI_NOT_ACTIVATED");
    }

    /// @param _pName       Project Name
    /// @param _coinAddr    Funding Token Address
    /// @param _stAddr      Stable Coin`s Address
    /// @param _pOFeePt     Project Owner`s Fee
    function setCrowdfunding(string memory _pName, address _coinAddr, address _stAddr, uint16 _pOFeePt) internal {
        require(_pName.length() > 2, "CF: NAME_MIN_3");
        require(_pName.length() < 13, "CF: NAME_MAX_12");
        require(_pOFeePt < LibCFDiamond.PERCENT_DIVISOR, "CF: INVALID_PERCENT");

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        ds.coinAddress = _coinAddr;
        ds.stableCoinAddress = _stAddr;
        ds.PROJECT_FEE_PERCENT_1 = _pOFeePt;

        // Sell Curve Coefficient 90%
        ds.SELL_CURVE_COEFFICIENT_PERCENT = 9000;
        // Crowdfunding Protocol Fee 1%
        ds.PROTOCOL_FEE_PERCENT_1 = 100;

        ds.treasuryAddress = 0xaFA6058126D8f48d49A9A4b127ef7e27C5e1DC43;

        /// Unique Project Token
        /// Name: Project Name
        /// Symbol: Protocol Prefix (T) + Project Name (Max 6 letters)
        ds._projectName = _pName.upper();
        string memory tokenSymbol = string("T").append(ds._projectName.slice(0, 6));
        ds.projectToken = address(new ProjectToken(ds._projectName, tokenSymbol));
    }

    /// Apply Project Owner Fee and Protocol Fee
    function _applyFee(uint256 _coinAmt) internal returns (uint256 totalFee) {
        DiamondStorage storage ds = diamondStorage();
        // Protocol Fee during investment
        uint256 _feeAmt = _coinAmt.mul(ds.PROTOCOL_FEE_PERCENT_1).div(PERCENT_DIVISOR);
        ds.protocolFeeAmt = ds.protocolFeeAmt.add(_feeAmt);
        totalFee = totalFee.add(_feeAmt);

        // Project Owner Fee during investment
        _feeAmt = _coinAmt.mul(ds.PROJECT_FEE_PERCENT_1).div(PERCENT_DIVISOR);
        ds.projectFeeAmt = ds.projectFeeAmt.add(_feeAmt);
        totalFee = totalFee.add(_feeAmt);
    }
}
