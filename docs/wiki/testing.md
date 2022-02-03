## Unit Tests

### Test Cases
CrowdFunding
1. Ownable
   - 1.1 Owner is able to transfer ownership
   - 1.2 No Owner is not able to transfer ownership
2. Pausable
   - 2.1 Owner is able to pause when NOT paused
   - 2.2 Owner is able to unpause when already paused
   - 2.3 Owner is NOT able to pause when already paused
   - 2.4 Owner is NOT able to unpause when already unpaused
3. Upgradable
   - 3.1 It should be kept origin data
   - 3.2 It should be set Treasury Address by only origin treasury account
4. Project Token Price with Bonding Curve Equation
   - 4.1 Project token`s buy price should be decided by Bonding Curve Formula
      - price:  10402 : BigNumber { value: "10" }
      - price:  20804 : BigNumber { value: "54" }
      - price:  31206 : BigNumber { value: "141" }
      - price:  41608 : BigNumber { value: "276" }
      - price:  52010 : BigNumber { value: "464" }
      - price:  62412 : BigNumber { value: "711" }
      - price:  72814 : BigNumber { value: "1019" }
      - price:  83216 : BigNumber { value: "1392" }
      - price:  93618 : BigNumber { value: "1832" }
      - price:  104020 : BigNumber { value: "2343" }
      - price:  114422 : BigNumber { value: "2927" }
   - 4.2 Project token`s sell price should be
      - price:  10402 : BigNumber { value: "9" }
      - price:  12898 : BigNumber { value: "15" }
      - price:  15994 : BigNumber { value: "26" }
      - price:  19832 : BigNumber { value: "44" }
      - price:  24592 : BigNumber { value: "72" }
      - price:  30494 : BigNumber { value: "119" }
      - price:  37813 : BigNumber { value: "198" }
      - price:  46888 : BigNumber { value: "328" }
      - price:  58142 : BigNumber { value: "542" }
      - price:  72096 : BigNumber { value: "896" }
      - price:  89399 : BigNumber { value: "1480" }
      - price:  110855 : BigNumber { value: "2446" }
5. Setting CrowdFunding Props by Project Owner
   - 5.1 Only project owner can set funding duration
   - 5.2 Only project owner can set min.threshold
   - 5.3 Only project owner can set project owner address
6. Investor Roles
   - 6.1 Before starting crowdfunding
      - 6.1.1 Investor can not invest before project owner allocate project coins to contract
      - 6.1.2 Investor can not invest while ongoing
      - 6.1.3 Investor can not invest before starting
   - 6.2 While ongoing crowdfunding
      - 6.2.1 Investor can not invest zero amount
      - 6.2.2 Investor can not invest too small amount
      - 6.2.3 Investor can invest with token price decided by Bonding Curve Formula
      - 6.2.4 Investor can withdraw funds while ongoing crowdfunding
   - 6.3 After finishing crowdfunding with not reached funds to MIN.Threshold
      - 6.3.1 Investor can not invest after finishing crowdfunding
      - 6.3.2 Investor can claim funds when the min. funding threshold is not reached within the timeline
      - 6.3.3 Investor can not claim coins when crowdfunding is finished and MIN.Threshold is not reached
   - 6.4 After finishing crowdfunding with reached funds to MIN.Threshold
      - 6.4.1 Investor can claim coins when crowdfunding is finished and MIN.Threshold is reached
      - 6.4.2 Investor can not claim funds when the min. funding threshold is reached within the timeline
7. Project Owner Roles
   - 7.2 While ongoing crowdfunding
      - 7.2.1 Project owner can not withdraw coins while ongoing crowdfunding
   - 7.3 After finishing crowdfunding with not reached funds to MIN.Threshold
      - 7.3.1 Project owner can withdraw coins when finishing crowdfunding and MIN.Threshold is not reached
   - 7.4 After finishing crowdfunding with reached funds to MIN.Threshold
      - 7.4.1 Project owner can not claim fees without setting project owner address
      - 7.4.2 Project owner can claim fees when finishing crowdfunding and MIN.Threshold is reached
      - 7.4.3 Project owner can claim funds when finishing crowdfunding and MIN.Threshold is not reached
