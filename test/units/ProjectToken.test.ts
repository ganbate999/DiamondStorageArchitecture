import {expect} from "chai";
import {ethers} from "hardhat";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ZERO_ADDRESS} from "../helper";
import {deployDiamond} from "../diamond";

export function likeProjectToken(): void {

  describe("- Project Token SC", function () {
    let projectToken: Contract;
    let crowdfundingFacet: Contract;
    let cfProjectToken: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let crowdfundingDiamond: string;

    beforeEach(async () => {

      this.ctx.signers = await ethers.getSigners();
      [owner, addr1, addr2] = this.ctx.signers;

      /// Test Stable Coin Deploy
      const StableCoinFactory = await ethers.getContractFactory("StableCoin", owner);
      const stableCoin = await StableCoinFactory.deploy("Tether USD", "USDT", 1000000);
      await stableCoin.deployed();

      await stableCoin.transfer(addr1.address, 100000);
      await stableCoin.transfer(addr2.address, 100000);

      /// Test Project Coin Deploy
      const ProjectCoinFactory = await ethers.getContractFactory("ProjectCoin", owner);
      const projectCoin = await ProjectCoinFactory.deploy("Test Project Coin", "TPC", 1000000 * 10 ^ 18);
      await projectCoin.deployed();

      /// Deploy Crowdfunding Diamond
      crowdfundingDiamond = await deployDiamond(projectCoin.address, stableCoin.address);

      crowdfundingFacet = await ethers.getContractAt('CrowdfundingFacet', crowdfundingDiamond);
      const projectTokenAddr = await crowdfundingFacet.projectToken();
      cfProjectToken = await ethers.getContractAt('ProjectToken', projectTokenAddr);

      /// Test Project Token Deploy
      const ProjectTokenFactory = await ethers.getContractFactory("ProjectToken", owner);
      projectToken = await ProjectTokenFactory.deploy("Test Project Token", "TETHERP");
      await projectToken.deployed();

    });

    describe("1. Ownership", async function () {

      it("1.1 Verify that the crowdfunding contract is the admin", async function () {
        expect(await projectToken.owner()).to.eq(owner.address);
      });
    });

    describe("2. Mint", async function () {

      it("2.1 Succeeds when the crowdfunding contract mints token", async function () {
        await expect(projectToken.mint(addr1.address, 1000)).to.emit(projectToken, 'Transfer').withArgs(ZERO_ADDRESS, addr1.address, 1000);
        expect(await projectToken.balanceOf(addr1.address)).to.eq(1000);
      });

      it("2.2 Succeeds when the crowdfunding contract mints token within the conversion period", async function () {

      });

      it("2.3 Fails when the crowdfunding contract mints token outside the conversion period", async function () {

      });

      it("2.4 Fails when other address mints token", async function () {
        await expect(projectToken.connect(addr1).mint(addr2.address, 1000)).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it("2.5 Fails when zero tokens minted", async function () {
        await expect(projectToken.mint(addr1.address, 0)).to.be.revertedWith('ERC20: mint amount zero');
      });
    });

    describe("3. Burn", async function () {
      beforeEach(async () => {
        await projectToken.mint(owner.address, 1000);
        await projectToken.mint(addr1.address, 1000);
      });

      it("3.1 Succeeds when the crowdfunding contract burns token", async function () {
        await expect(projectToken.burn(100)).to.be.emit(projectToken, 'Transfer').withArgs(owner.address, ZERO_ADDRESS, 100);
        expect(await projectToken.balanceOf(owner.address)).to.eq(900);
      });

      it("3.2 Succeeds when the crowdfunding contract burns token within the conversion period", async function () {

      });

      it("3.3 Succeeds when the crowdfunding contract burns token outside the conversion period", async function () {

      });

      it("3.4 Fails when other address burns token", async function () {
        await expect(projectToken.connect(addr1).burn(100)).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it("3.5 Fails when zero tokens burnt", async function () {
        await expect(projectToken.burn(0)).to.be.revertedWith('ERC20: burn amount zero');
      });
    });

    describe("4. Transfer", async function () {
      beforeEach(async () => {
        await projectToken.mint(owner.address, 1000);
        await projectToken.mint(addr1.address, 1000);
      });

      it("4.1 Check it is deactivated", async function () {
        await expect(projectToken.connect(addr1).transfer(addr2.address, 100)).to.be.revertedWith('Ownable: caller is not the owner');

        await expect(projectToken.transfer(addr1.address, 100)).to.be.emit(projectToken, 'Transfer').withArgs(owner.address, addr1.address, 100);
        expect(await projectToken.balanceOf(owner.address)).to.eq(900);
        expect(await projectToken.balanceOf(addr1.address)).to.eq(1100);
      });
    });

    describe("5. TransferFrom", async function () {
      beforeEach(async () => {
        await projectToken.mint(owner.address, 1000);
        await projectToken.mint(addr1.address, 1000);
      });

      it("5.1 Check it is deactivated", async function () {
        await projectToken.approve(addr1.address, 100);
        await expect(projectToken.connect(addr1).transferFrom(owner.address, addr2.address, 100)).to.be.revertedWith('Ownable: caller is not the owner');

        await projectToken.connect(addr1).approve(owner.address, 100);
        await expect(projectToken.transferFrom(addr1.address, addr2.address, 100)).to.be.emit(projectToken, 'Transfer').withArgs(addr1.address, addr2.address, 100);
        expect(await projectToken.balanceOf(addr1.address)).to.eq(900);
        expect(await projectToken.balanceOf(addr2.address)).to.eq(100);
      });
    });

    describe("6. Approve", async function () {
      beforeEach(async () => {
        await projectToken.mint(owner.address, 1000);
      });

      it("6.1 Check it is deactivated", async function () {
        await expect(projectToken.connect(addr1).transferFrom(owner.address, addr2.address, 100)).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });
}