### Deploying contract
* Environment variables
    - Create a `.env` file with its values:
```
INFURA_API_KEY=[YOUR_INFURA_API_KEY_HERE]
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the contract
```console
$ yarn hardhat mainnet:CrowdFunding --network mainnet --name <PROJECT_NAME> --coin_addr <PROJECT_COIN_ADDRESS> --stbcoin_addr <STABLECOIN_ADDRESS> --project_fee <PROJECT_FEE> --start <START_TIMESTAMP> --end <END_TIMESTAMP> --minThreshold <MIN_THRESHOLD>
```

* Parameters
  + name: 
    + Description: Project Name
    + Type: String
    + Require: MIN: 3 letters, MAX: 12 letters
  + coinAddr: 
    + Description: Project Coin Address for crowdfunding
    + Type: Address
  + stbcoinAddr: 
    + Description: Stable Coin`s Address that investors invest with
    + Type: Address
  + projectFee:
    + Description: Project commission fees to be deducted & stored as escrow for the project owner.
    + Type: Unsigned Integer
    + Require: MIN: 0, MAX: 10000
  + start:
    + Description: Project commission fees to be deducted & stored as escrow for the project owner.
    + Type: Unsigned Integer (GMT TIMESTAMP)
    + Require: TIMESTAMP
  + end:
    + Description: Project commission fees to be deducted & stored as escrow for the project owner.
    + Type: Unsigned Integer (GMT TIMESTAMP)
    + Require: TIMESTAMP
  + minThreshold:
    + Description: MIN Fund Amount for completing crowdfunding.
    + Type: Unsigned Integer
