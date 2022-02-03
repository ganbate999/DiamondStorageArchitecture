import {expect} from "chai";
import {ethers} from "hardhat";
import {Contract, constants} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {
    AFTER_ONE_DAY_TIMESTAMP,
    AFTER_ONE_HOUR_TIMESTAMP,
    BEFORE_ONE_HOUR_TIMESTAMP,
    FUNDING_COIN_SUPPLY,
    TIMESTAMP_NOW
} from "../../helper";

export function shouldBehaveLikeProjectOwnerRoles(): void {
    describe("7. Project Owner Roles", async function () {
        let crowdfundingFacet: Contract;
        let stableCoin: Contract;
        let projectCoin: Contract;
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;
        let addr3: SignerWithAddress;

        beforeEach(async () => {
            [owner, addr1, addr2, addr3] = this.ctx.signers;
            crowdfundingFacet = this.ctx.crowdfundingFacet;
            stableCoin = this.ctx.stableCoin;
            projectCoin = this.ctx.projectCoin;

            // set Min.Threshold
            await crowdfundingFacet.setMinFundingThreshold(10000);

            const projectTokenAddr = await crowdfundingFacet.projectToken();
            const projectToken = await ethers.getContractAt('ProjectToken', projectTokenAddr);

            // approve
            await projectToken.connect(addr1).approve(crowdfundingFacet.address, constants.MaxUint256);
            await projectToken.connect(addr2).approve(crowdfundingFacet.address, constants.MaxUint256);
            await projectToken.connect(addr3).approve(crowdfundingFacet.address, constants.MaxUint256);
        });

        describe("7.1 Before starting crowdfunding", async function () {
            // Configuration for "Before starting"
            beforeEach(async () => {
                await crowdfundingFacet.setFundingDuration(AFTER_ONE_HOUR_TIMESTAMP, AFTER_ONE_DAY_TIMESTAMP);
            });
        });

        describe("7.2 While ongoing crowdfunding", async function () {
            // Configuration for "While ongoing"
            beforeEach(async () => {
                await crowdfundingFacet.setFundingDuration(TIMESTAMP_NOW, AFTER_ONE_DAY_TIMESTAMP);

                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);
            });


            it("7.2.1 Project owner can not withdraw coins while ongoing crowdfunding", async function(){

                // Not Ending Fund
                await expect(crowdfundingFacet.withdrawCoin()).to.revertedWith('CF: NOT_ENDED');
            });
        });

        describe("7.3 After finishing crowdfunding with not reached funds to MIN.Threshold", async function () {
            // Configuration for "After finishing"
            beforeEach(async () => {
                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);

                await crowdfundingFacet.setFundingDuration(0, AFTER_ONE_HOUR_TIMESTAMP);
                await crowdfundingFacet.setMinFundingThreshold(20000);

                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr1.address, stableCoin.address, 10402, 1022);

                // Not Ending Fund
                await expect(crowdfundingFacet.connect(addr1).ireclaimFund(stableCoin.address)).to.revertedWith('CF: NOT_ENDED');

                // Set Ending Fund
                await crowdfundingFacet.setFundingDuration(0, BEFORE_ONE_HOUR_TIMESTAMP);
            });


            it("7.3.1 Project owner can withdraw coins when finishing crowdfunding and MIN.Threshold is not reached", async function() {

                // Withdraw supplied project coins
                await expect(crowdfundingFacet.withdrawCoin()).to.emit(crowdfundingFacet, 'WithdrawCoin').withArgs(20000);
            });
        });

        describe("7.4 After finishing crowdfunding with reached funds to MIN.Threshold", async function () {
            // Configuration for "After finishing"
            beforeEach(async () => {
                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);

                await crowdfundingFacet.setFundingDuration(0, AFTER_ONE_HOUR_TIMESTAMP);
                await crowdfundingFacet.setMinFundingThreshold(20000);

                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr1.address, stableCoin.address, 10402, 1022);

                // Invest - Current Supply: 20804 => BuyPrice : 53
                await stableCoin.connect(addr2).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr2).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr2.address, stableCoin.address, 10402, 196);

                // Set Ending Fund
                await crowdfundingFacet.setFundingDuration(0, BEFORE_ONE_HOUR_TIMESTAMP);
            });

            it("7.4.1 Project owner can not claim fees without setting project owner address", async function() {

                await expect(crowdfundingFacet.claimFees()).to.revertedWith('CF: ZERO_ADDRESS');
            });

            it("7.4.2 Project owner can claim fees when finishing crowdfunding and MIN.Threshold is reached", async function() {

                await crowdfundingFacet.setProjectOwnerAddr(owner.address);

                // Project Owner Fee : 0.7%
                // Total Invest Amount : 20804
                await expect(crowdfundingFacet.claimFees()).to.emit(crowdfundingFacet, 'ClaimFees').withArgs(144);
            });

            it("7.4.3 Project owner can claim funds when finishing crowdfunding and MIN.Threshold is not reached", async function() {

                await crowdfundingFacet.setProjectOwnerAddr(owner.address);

                // Claim Fund
                // Total Invest Amount : 20804
                // Total Fee : 1%
                await expect(crowdfundingFacet.claimFund()).to.emit(crowdfundingFacet, 'ClaimFund').withArgs(20452);
            });
        });
    });
}
