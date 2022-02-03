## Features
* The project owner is able to set these params:
  - startTimestamp & endTimestamp of timeline duration
  - it's project owner address
  - min. funding threshold (in USD)
* Condition for SC activation:
  - the project owner sends the allocated supply to the contract after deployment
* Commission:
  - Protocol fees
    + collected during investment (sure) & withdrawal (not sure). The fees during withdrawal is to be decided later during based on DAO governance based decision making.
  - Project owner fees
    + collected during investment (not sure) & withdrawal (not sure). The decision is pending from the market & project.
* Investor roles:
  - invest money via `iinvest()` function in stablecoins (like USDC, USDT, etc.) or unstablecoins (like ETH, BSC, WBTC, RBTC, etc.).
    + project tokens to be minted
    + protocol fees to be deducted & stored as escrow for the protocol wallet address.
    + project commission fees to be deducted & stored as escrow for the project owner.
  - withdraw money via `iwithdrawFund()` function by depositing minted tokens (gets burned) & receives in stablecoins or unstablecoins.
    + Case-1: If the investor invested in USDC, then during withdrawal, it receives in USDC.
    + Case-2: If the investor invested in unstablecoins, they will be given the option to receive in either stable or unstable coins. The swap happens via an DEX interface attached with the contract.
  - reclaim fund via `ireclaimFund()` function, when the min. funding threshold (set by the project owner) is not reached within the timeline.
    + This can be done post the timeline only if the min. funding threshold (min. USD fund to be raised) is NOT reached within the timeline.
  - claim project coin via `iclaimCoin()` function.
    + This can be done post the timeline only if the min. funding threshold (min. USD fund to be raised) is reached within the timeline.
* Project owner roles:
  - withdraw deposited coins via `withdrawCoin()` function
    + This can be done post the timeline only if the min. funding threshold (min. USD fund to be raised) is NOT reached within the timeline.
  - claim fees via `claimFees()` function
    + This can be done at any point of time after the min. funding threshold (min. USD fund to be raised) is reached within the timeline.
  - claim Funding via `claimFund()` function
    + This can be done post the timeline only if the min. funding threshold (min. USD fund to be raised) is reached within the timeline.
* Protocol owner roles:
  - claim commission fees via `tclaimFees()`
    + This can be done at any point of time after the min. funding threshold (min. USD fund to be raised) is reached within the timeline.
* Get price:
  - function: `getPrice()`
  - view price of the project token
  - This depends on Bonding curve equation.
* Utils:
  - Create a utility library which will contain all the mathematical calculations and will be used inside the functions of the main contract.
  - functions include
    + `_calculatePrice()`: calculate real-time price (in USD) of project token.
    + `isFundingTh()`: is Funding threshold reached.
      - deduct the protocol fees, project owner fees & then check if the totalFundingAmt >= fundingThreshold
