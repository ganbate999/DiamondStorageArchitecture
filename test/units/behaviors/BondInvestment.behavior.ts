import {expect} from "chai";
import {ethers} from "hardhat";
import {BigNumber, Contract, constants} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {AFTER_ONE_DAY_TIMESTAMP, AFTER_ONE_HOUR_TIMESTAMP, BEFORE_ONE_HOUR_TIMESTAMP, TIMESTAMP_NOW, FUNDING_COIN_SUPPLY} from "../../helper";

// Bond Investment project owner fee (1%)
const BOND_PROJECT_OWNER_FEE = 100;

export function shouldBehaveLikeBondInvestment(): void {
    describe("8. Bond Investment", async function () {
        let crowdfundingFacet: Contract;
        let stableCoin: Contract;
        let projectCoin: Contract;
        let bondfundingFacet: Contract;
        let bondToken: Contract;
        let askCoin1: Contract;
        let askCoin2: Contract;
        let owner: SignerWithAddress;
        let provider1: SignerWithAddress;
        let provider2: SignerWithAddress;
        let provider3: SignerWithAddress;
        let investor1: SignerWithAddress;
        let investor2: SignerWithAddress;
        let investor3: SignerWithAddress;

        beforeEach(async () => {
            [owner, investor1, investor2, investor3, provider1, provider2, provider3] = this.ctx.signers;
            crowdfundingFacet = this.ctx.crowdfundingFacet;
            stableCoin = this.ctx.stableCoin;
            projectCoin = this.ctx.projectCoin;

            // set Min.Threshold
            await crowdfundingFacet.setMinFundingThreshold(10_000);

            const projectTokenAddr = await crowdfundingFacet.projectToken();
            const projectToken = await ethers.getContractAt('ProjectToken', projectTokenAddr);

            // approve
            await projectToken.connect(investor1).approve(crowdfundingFacet.address, constants.MaxUint256);
            await projectToken.connect(investor2).approve(crowdfundingFacet.address, constants.MaxUint256);
            await projectToken.connect(investor3).approve(crowdfundingFacet.address, constants.MaxUint256);

            await crowdfundingFacet.setFundingDuration(AFTER_ONE_HOUR_TIMESTAMP, AFTER_ONE_DAY_TIMESTAMP);

            // Get BondFunding Contract
            bondfundingFacet = this.ctx.bondfundingFacet;

            /// Ask Coin1 Deploy
            const AskCoin1Factory = await ethers.getContractFactory("AskCoin1", provider1);
            askCoin1 = await AskCoin1Factory.deploy("ASK COIN1", "ACN1", 1000_000);
            await askCoin1.deployed();

            askCoin1.connect(provider1).transfer(investor1.address, 100_000);
            askCoin1.connect(provider1).transfer(investor2.address, 100_000);
            askCoin1.connect(provider1).transfer(investor3.address, 100_000);

            /// Ask Coin2 Deploy
            const AskCoin2Factory = await ethers.getContractFactory("AskCoin2", provider2);
            askCoin2 = await AskCoin2Factory.deploy("ASK COIN2", "ACN2", 1000_000);
            await askCoin2.deployed();

            askCoin2.connect(provider2).transfer(investor1.address, 100_000);
            askCoin2.connect(provider2).transfer(investor2.address, 100_000);
            askCoin2.connect(provider2).transfer(investor3.address, 100_000);
        });

        it("8.1 Fails that project owner launch Bond Investment", async function(){
            await expect(crowdfundingFacet.launchBondInv(BOND_PROJECT_OWNER_FEE)).to.revertedWith('CF: NOT_REACHED_MIN_THRESHOLD');
        });

        describe("8.2 Not reached funds to MIN.Threshold (Before Threshold Point)", async function () {
            // Configuration for "Not reached to MIN.Threshold"
            beforeEach(async () => {
                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);

                await crowdfundingFacet.setFundingDuration(BEFORE_ONE_HOUR_TIMESTAMP, AFTER_ONE_HOUR_TIMESTAMP);
                await crowdfundingFacet.setMinFundingThreshold(20_000);

                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(investor1).approve(crowdfundingFacet.address, 10_402);
                await expect(crowdfundingFacet.connect(investor1).iinvest(stableCoin.address, 10_402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(investor1.address, stableCoin.address, 10_402, 1_022);
            });

            it("8.2.1 Fails that project owner launch Bond Investment", async function(){
                await expect(crowdfundingFacet.launchBondInv(BOND_PROJECT_OWNER_FEE)).to.revertedWith('CF: NOT_REACHED_MIN_THRESHOLD');
            })
        });

        describe("8.3 After reached funds to MIN.Threshold (After Threshold Point)", async function () {
            // Configuration for "After finishing"
            beforeEach(async () => {
                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);

                await crowdfundingFacet.setFundingDuration(BEFORE_ONE_HOUR_TIMESTAMP, AFTER_ONE_HOUR_TIMESTAMP);
                await crowdfundingFacet.setMinFundingThreshold(20_000);

                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(investor1).approve(crowdfundingFacet.address, 10_402);
                await expect(crowdfundingFacet.connect(investor1).iinvest(stableCoin.address, 10_402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(investor1.address, stableCoin.address, 10_402, 1_022);

                // Invest - Current Supply: 20804 => BuyPrice : 53
                await stableCoin.connect(investor2).approve(crowdfundingFacet.address, 10_402);
                await expect(crowdfundingFacet.connect(investor2).iinvest(stableCoin.address, 10_402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(investor2.address, stableCoin.address, 10_402, 196);

                // Active Bond Investment
                await crowdfundingFacet.launchBondInv(BOND_PROJECT_OWNER_FEE);

                const bondTokenAddr = await bondfundingFacet.bondToken();
                bondToken = await ethers.getContractAt('BondToken', bondTokenAddr);
            });

            it("8.3.1 Project owner should have BondToken all supply amount", async function(){
                expect(await bondToken.balanceOf(owner.address)).to.be.eq(BigNumber.from(10).pow(BigNumber.from(23)));
            })

            it("8.3.2 Succeeds that providers create offer", async function(){
                // Transfer BondToken from project owner to provider
                await bondToken.transfer(provider1.address, 100);
                await bondToken.transfer(provider2.address, 100);

                // Provider1 create offer
                await bondToken.connect(provider1).approve(bondfundingFacet.address, 100);
                await expect(bondfundingFacet.connect(provider1).mCreateOffer(100, askCoin1.address, 10_000)).to.emit(bondfundingFacet, 'BCreatOffer').withArgs(0, provider1.address, 100, askCoin1.address, 10_000);

                // Provider2 create offer
                await bondToken.connect(provider2).approve(bondfundingFacet.address, 100);
                await expect(bondfundingFacet.connect(provider2).mCreateOffer(100, askCoin2.address, 10_000)).to.emit(bondfundingFacet, 'BCreatOffer').withArgs(1, provider2.address, 100, askCoin2.address, 10_000);
            });


            describe("8.3.3 When Bond Investment is activated and provider created offer", async function () {
                beforeEach(async function() {
                    await bondToken.transfer(provider1.address, 1000);
                    await bondToken.transfer(provider2.address, 1000);

                    await bondToken.connect(provider1).approve(bondfundingFacet.address, 100);
                    await expect(bondfundingFacet.connect(provider1).mCreateOffer(100, stableCoin.address, 10_000)).to.emit(bondfundingFacet, 'BCreatOffer').withArgs(0, provider1.address, 100, stableCoin.address, 10_000);
                });

                it("8.3.3.1 Succeeds if provider can edit Offer", async function() {
                    await bondToken.connect(provider1).approve(bondfundingFacet.address, 100)
                    await expect(bondfundingFacet.connect(provider1).mEditOffer(0, 200, stableCoin.address, 20_000)).to.emit(bondfundingFacet, 'BEditOffer').withArgs(0, 200, stableCoin.address, 20_000);
                });

                it("8.3.3.2 Fails if another provider edit Offer", async function() {
                    await expect(bondfundingFacet.connect(provider2).mEditOffer(0, 200, stableCoin.address, 20_000)).to.revertedWith('BF: NOT_OWNER');
                });

                it("8.3.3.3 Succeeds if provider can delete Offer", async function() {
                    await expect(bondfundingFacet.connect(provider1).mDeleteOffer(0)).to.emit(bondfundingFacet, 'BDeleteOffer').withArgs(0);
                });

                it("8.3.3.4 Fails if another provider delete Offer", async function() {
                    await expect(bondfundingFacet.connect(provider2).mDeleteOffer(0)).to.revertedWith('BF: NOT_OWNER');
                });

                it("8.3.3.5 Succeeds if buyer can buy BondToken", async function() {
                    await stableCoin.connect(investor1).approve(bondfundingFacet.address, 2_000);
                    await expect(bondfundingFacet.connect(investor1).mBuyOffer(0, 10, stableCoin.address, 2_000)).to.emit(bondfundingFacet, 'BBuyOffer').withArgs(0, investor1.address, 10, stableCoin.address, 2_000);
                });
            });
        });

        describe("8.4 After ending crowdfunding", async function () {
            // Configuration for "After finishing"
            beforeEach(async () => {
                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);

                await crowdfundingFacet.setFundingDuration(0, AFTER_ONE_HOUR_TIMESTAMP);
                await crowdfundingFacet.setMinFundingThreshold(20_000);

                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(investor1).approve(crowdfundingFacet.address, 10_402);
                await expect(crowdfundingFacet.connect(investor1).iinvest(stableCoin.address, 10_402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(investor1.address, stableCoin.address, 10_402, 1_022);

                // Invest - Current Supply: 20804 => BuyPrice : 53
                await stableCoin.connect(investor2).approve(crowdfundingFacet.address, 10_402);
                await expect(crowdfundingFacet.connect(investor2).iinvest(stableCoin.address, 10_402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(investor2.address, stableCoin.address, 10_402, 196);

            });

            it("8.4.1 Fails that project owner launch Bond Investment", async function(){
                // Set Ending of crowdfundingFacet
                await crowdfundingFacet.setFundingDuration(0, BEFORE_ONE_HOUR_TIMESTAMP);

                await expect(crowdfundingFacet.launchBondInv(BOND_PROJECT_OWNER_FEE)).to.revertedWith('CF: NOT_ONGOING');
            });

            it("8.4.2 Fails that provider create offer", async function(){
                // Launch Bond Investment
                await crowdfundingFacet.launchBondInv(BOND_PROJECT_OWNER_FEE)
                // Get BondToken
                const bondTokenAddr = await bondfundingFacet.bondToken();
                bondToken = await ethers.getContractAt('BondToken', bondTokenAddr);

                await bondToken.transfer(provider1.address, 100);
                // Set Ending of crowdfundingFacet
                await crowdfundingFacet.setFundingDuration(0, BEFORE_ONE_HOUR_TIMESTAMP);
                await expect(bondfundingFacet.connect(provider1).mCreateOffer(100, askCoin1.address, 10_000)).to.revertedWith('CF: NOT_ONGOING');
            });
        });
    })
}
