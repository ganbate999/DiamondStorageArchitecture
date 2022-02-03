## Implementation

### SC System Design
#### State Variables
* `contributionsMap` of type `mapping` has:
    - key: `address`
    - value: array of `FundData` where,
        + `FundData` is a struct of attributes:
            - `tokenAmt` of type: `uint256`
            - `stableCoinAmt` of type: `uint256`
* `totalPTokenAmt` of type `uint256`
* `totalStableCoinAmt` of type `uint256`
* `totalCirculatingStableCoinAmt` of type `uint256`
* `projectFeeAmt` of type `uint256`
* `protocolFeeAmt` of type `uint256`
* `projectToken` of type `address`
* `coinAddress` of type `address`
* `allocatedCoinAmt` of type `address`
* `projectOwnerAddr` of type `address`
* `treasuryAddress` of type `address`
* `minFundingThreshold` of type `uint256`
* `startTimestamp` of type `uint256`
* `endTimestamp` of type `uint256`
* `stableCoinAddress` of type `address`
* `projectOwnerFeePt` of type `uint16`

#### Upgradable Initializer 
* Set the project coin address `coinAddress`.
* Set the stable coin address `stableCoinAddress`.
* Set the project fee as percent (10000 > fee >= 0) `projectOwnerFeePt`.
* Deploy the mintable project token with name "T******"(Protocal Symbol "T" + Project name`s first 6 letters uppercase)
* Set treasury address as default: `0xaFA6058126D8f48d49A9A4b127ef7e27C5e1DC43`
* Initialize with Ownable in order to set the deployer as admin, which can be viewed using `owner()` function (inherited from `OwnableUpgradeable`).
* Initialize with Pausable (inherited from `PausableUpgradeable`) 
* Initialize with ReentrancyGuard for contract security (inherited from `ReentrancyGuardUpgradeable`).

#### Public Functions
* `setFundingDuration` has params:
    - `_startTimestamp` of type `uint256`
    - `_endTimestamp` of type `uint256`
* `setMinFundingThreshold` has params:
    - `_minFundingThreshold` of type `uint256`
* `setProjectOwnerAddr` has params:
    - `_projectOwnerAddr` of type `address`
* `allocateSupply` has params:
    - `_amount` of type `uint256`
* `getBuyPrice` has params:
    - `_investAmount` of type `uint256`
* `getSellPrice` has params:
    - `_investAmount` of type `uint256`
* `iinvest` has params:
    - `__coinAddress` of type `address`
    - `__investAmt` of type `uint256`
* `iwithdrawFund` has params:
    - `__coinAddress` of type `address`
* `ireclaimFund` has params:
    - `__coinAddress` of type `uint256`
* `iclaimCoin` has no params:
* `withdrawCoin` has no params:
* `claimFees` has no params:
* `claimFund` has no params:
* `tclaimFees` has no params:

#### Internal Functions
* `_swap` has params:
  - `_tokenIn` of type `address`
  - `_tokenOut` of type `address`
  - `_amountIn` of type `uint256`
* `__getAmountOutMin` has params:
  - `_tokenIn` of type `address`
  - `_tokenOut` of type `address`
  - `_amountIn` of type `uint256`

#### Events
* `SetProjectOwnerAddr` has params:
    - `walletAddress`
* `IInvest` has params:
    - `investor`
    - `investToken`
    - `stableAmount`
    - `tokenAmount`
* `IWithdrawFund` has params:
    - `investor`
    - `amount`
* `IReclaimFund` has params:
    - `investor`
    - `amount`
* `IClaimFund` has params:
    - `investor`
    - `amount`
* `IClaimCoin` has params:
    - `investor`
    - `amount`
* `WithdrawCoin` has params:
    - `amount`
* `ClaimFees` has params:
    - `amount`
* `ClaimFund` has params:
    - `amount`
* `TClaimFees` has params:
    - `amount`
  
#### Libraries
* FundingUtils for Bonding Curve Equation
* SafeMath for `uint256` Math functions
* Strings for `string` functions
