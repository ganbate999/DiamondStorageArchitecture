import {upgrades, ethers} from "hardhat";

import {shouldBehaveLikeOwnable} from "./behaviors/Ownable.behavior";
import {shouldBehaveLikePausable} from "./behaviors/Pausable.behavior";
import {shouldBehaveLikeUpgradeable} from "./behaviors/Upgradable.behavior";
import {shouldBehaveLikeBondingCurve} from "./behaviors/BondingCurve.behavior";
import {shouldBehaveLikeSetProps} from "./behaviors/SetProps.behavior";
import {shouldBehaveLikeInvestorRoles} from "./behaviors/InvestorRoles.behavior";
import {shouldBehaveLikeProjectOwnerRoles} from "./behaviors/ProjectOwnerRoles.behavior";
import {shouldBehaveLikeBondInvestment} from "./behaviors/BondInvestment.behavior";
import {deployDiamond} from "../diamond";

const PROJECT_NAME = "MyFunding";
const PROJECT_OWNER_FEE = 70;

export function likeCrowdfunding(): void {

  describe("- Crowdfunding SC", function () {


    beforeEach(async () => {

      this.ctx.signers = await ethers.getSigners();
      const [owner, addr1, addr2, addr3] = this.ctx.signers;

      /// Test Stable Coin Deploy
      const StableCoinFactory = await ethers.getContractFactory("StableCoin", owner);
      const stableCoin = await StableCoinFactory.deploy("Tether USD", "USDT", 1000000);
      await stableCoin.deployed();
      this.ctx.stableCoin = stableCoin;

      await stableCoin.transfer(addr1.address, 100000);
      await stableCoin.transfer(addr2.address, 100000);
      await stableCoin.transfer(addr3.address, 100000);

      /// Test Project Coin Deploy
      const ProjectCoinFactory = await ethers.getContractFactory("ProjectCoin", owner);
      const projectCoin = await ProjectCoinFactory.deploy("Test Project Coin", "TPC", 1000000 * 10 ^ 18);
      await projectCoin.deployed();
      this.ctx.projectCoin = projectCoin;

      /// Deploy Crowdfunding Diamond
      this.ctx.crowdfunding = await deployDiamond(projectCoin.address, stableCoin.address);

      // Set Facet Addresses
      this.ctx.diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', this.ctx.crowdfunding)
      this.ctx.diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', this.ctx.crowdfunding)
      this.ctx.ownershipFacet = await ethers.getContractAt('OwnershipFacet', this.ctx.crowdfunding)
      this.ctx.pausableFacet = await ethers.getContractAt('PausableFacet', this.ctx.crowdfunding)
      this.ctx.crowdfundingFacet = await ethers.getContractAt('CrowdfundingFacet', this.ctx.crowdfunding)
      this.ctx.bondfundingFacet = await ethers.getContractAt('BondfundingFacet', this.ctx.crowdfunding)
    });

    shouldBehaveLikeOwnable();

    shouldBehaveLikePausable();

    shouldBehaveLikeUpgradeable();

    shouldBehaveLikeBondingCurve();

    shouldBehaveLikeSetProps();

    shouldBehaveLikeInvestorRoles();

    shouldBehaveLikeProjectOwnerRoles();

    shouldBehaveLikeBondInvestment();
  });
}
