import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import {deployDiamond} from "../../diamond";

task("rinkeby:Crowdfunding", "Deploy CrowdFunding")
    .addParam("name", "The project`s name")
    .addParam("coinAddr", "The project's coin address")
    .addParam("stbcoinAddr", "The stable coin's address")
    .addParam("projectFee", "The project owner`s fee")
    .addParam("start", "The GMT timestamp of starting crowdfunding")
    .addParam("end", "The GMT timestamp of ending crowdfunding")
    .addParam("minThreshold", "The MIN.Threshold for completing crowdfunding")
    .setAction(async function (taskArguments: TaskArguments, { ethers, upgrades }) {
        /// Deploy CrowdFunding
        const crowdFundingDiamond = await deployDiamond(ethers, taskArguments.name, taskArguments.coinAddr, taskArguments.stbcoinAddr, taskArguments.projectFee);
        const crowdFundingFacet = await ethers.getContractAt('CrowdfundingFacet', crowdFundingDiamond);


        await crowdFundingFacet.setFundingDuration(taskArguments.start, taskArguments.end);
        await crowdFundingFacet.setMinFundingThreshold(taskArguments.minThreshold);

        console.log("CrowdFunding deployed to:", crowdFundingDiamond);
    });
