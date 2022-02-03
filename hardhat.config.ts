import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import "./deployment/index";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


// Ensure that we have all the environment variables we need.
const accountPrivateKey = process.env.PRIVATE_KEY;
if (!accountPrivateKey) {
  throw new Error("Please set your private key in a .env file");
}

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "development",
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  networks: {
    development: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      hardfork: 'istanbul',
      gas: 9500000,
      chainId: 31337,
      accounts: {
        count: 10,
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        path: "m/44'/60'/0'/0",
      }
    },
    ropsten: {
      url:
        process.env.INFURA_API_KEY !== undefined ? "https://ropsten.infura.io/v3/" + infuraApiKey : "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId:3,
    },
    rinkeby: {
      url:
          process.env.INFURA_API_KEY !== undefined ? "https://rinkeby.infura.io/v3/" + infuraApiKey : "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId:4,
    },
    ethermain: {
      url:
          process.env.INFURA_API_KEY !== undefined ? "https://mainnet.infura.io/v3/" + infuraApiKey : "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId:1,
    },
    avaxtest: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 43113,
    },
    avaxmain: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 43114,
    }
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "USD",
  },
  typechain: {
    outDir: "./build/typechain",
    target: "ethers-v5",
  },
  paths: {
    sources: "contracts",
    artifacts: "./build/artifacts",
    cache: "./build/cache",
  }
};
