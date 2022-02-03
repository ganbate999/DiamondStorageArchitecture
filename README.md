# Crowdfunding-Contract
An `upgradable`, `pausable` __crowdfunding__ smart contract which can be used as a _template_ by every __project owner__.

## About
* It's a Crowdfunding contract.
* For more, refer [Wiki](./docs/wiki).

## Installation
```console
$ yarn install
```

## Usage

### Build
```console
$ yarn compile
```

### Test
```console
$ yarn test
```


### Deploying contracts to Testnet (Public)

#### ETH Testnet - Ropsten
* Environment variables
  - Create a `.env` file with its values:
```
INFURA_API_KEY=[YOUR_INFURA_API_KEY_HERE]
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the contract
```console
$ yarn hardhat ropsten:Crowdfunding --network ropsten --name <PROJECT_NAME> --coinAddr <PROJECT_COIN_ADDRESS> --stbcoinAddr <STABLECOIN_ADDRESS> --projectFee <PROJECT_FEE> --start <START_TIMESTAMP> --end <END_TIMESTAMP> --minThreshold <MIN_THRESHOLD>
```

#### ETH Testnet - Rinkeby
* Environment variables
    - Create a `.env` file with its values:
```
INFURA_API_KEY=[YOUR_INFURA_API_KEY_HERE]
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the contract
```console
$ yarn hardhat rinkeby:Crowdfunding --network rinkeby --name <PROJECT_NAME> --coinAddr <PROJECT_COIN_ADDRESS> --stbcoinAddr <STABLECOIN_ADDRESS> --projectFee <PROJECT_FEE> --start <START_TIMESTAMP> --end <END_TIMESTAMP> --minThreshold <MIN_THRESHOLD>
```

#### Avalanche Testnet
* Environment variables
  - Create a `.env` file with its values:
```
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the contract
```console
$ yarn hardhat avaxtest:Crowdfunding --network avaxtest --name <PROJECT_NAME> --coinAddr <PROJECT_COIN_ADDRESS> --stbcoinAddr <STABLECOIN_ADDRESS> --projectFee <PROJECT_FEE> --start <START_TIMESTAMP> --end <END_TIMESTAMP> --minThreshold <MIN_THRESHOLD>
```


### Deploying contracts to Mainnet
#### ETH Mainnet
* Environment variables
    - Create a `.env` file with its values:
```
INFURA_API_KEY=[YOUR_INFURA_API_KEY_HERE]
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the contract
```console
$ yarn hardhat ethermain:Crowdfunding --network ethermain --name <PROJECT_NAME> --coinAddr <PROJECT_COIN_ADDRESS> --stbcoinAddr <STABLECOIN_ADDRESS> --projectFee <PROJECT_FEE> --start <START_TIMESTAMP> --end <END_TIMESTAMP> --minThreshold <MIN_THRESHOLD>
```

#### Avalanche Mainnet
* Environment variables
  - Create a `.env` file with its values:
```
DEPLOYER_PRIVATE_KEY=[YOUR_DEPLOYER_PRIVATE_KEY_without_0x]
REPORT_GAS=<true_or_false>
```

* Deploy the contract
```console
$ yarn hardhat avaxmain:Crowdfunding --network avaxmain --name <PROJECT_NAME> --coinAddr <PROJECT_COIN_ADDRESS> --stbcoinAddr <STABLECOIN_ADDRESS> --projectFee <PROJECT_FEE> --start <START_TIMESTAMP> --end <END_TIMESTAMP> --minThreshold <MIN_THRESHOLD>
```
