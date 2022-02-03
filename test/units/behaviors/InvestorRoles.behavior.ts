import {expect} from "chai";
import {ethers} from "hardhat";
import {Contract, constants} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {AFTER_ONE_DAY_TIMESTAMP, AFTER_ONE_HOUR_TIMESTAMP, BEFORE_ONE_HOUR_TIMESTAMP, TIMESTAMP_NOW, FUNDING_COIN_SUPPLY} from "../../helper";

export function shouldBehaveLikeInvestorRoles(): void {
    describe("6. Investor Roles", async function () {
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

        describe("6.1 Before starting crowdfunding", async function () {
            // Configuration for "Before starting"
            beforeEach(async () => {
                await crowdfundingFacet.setFundingDuration(AFTER_ONE_HOUR_TIMESTAMP, AFTER_ONE_DAY_TIMESTAMP);
            });

            it("6.1.1 Investor can not invest before project owner allocate project coins to contract", async function(){
                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 1000);
                // Zero Amount
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 0)).to.revertedWith('CF: NOT_ONGOING');
            })

            it("6.1.2 Investor can not invest while ongoing", async function(){
                /// Allocate Funding Project Coin to crowdfundingFacetFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);

                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 1000);
                // Zero Amount
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 10402)).to.revertedWith('CF: NOT_ONGOING');
            })


            it("6.1.3 Investor can not invest before starting", async function(){

            })
        });

        describe("6.2 While ongoing crowdfunding", async function () {
            // Configuration for "While ongoing"
            beforeEach(async () => {
                await crowdfundingFacet.setFundingDuration(TIMESTAMP_NOW, AFTER_ONE_DAY_TIMESTAMP);

                /// Allocate Funding Project Coin to crowdfundingFacet
                await projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
                await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);
            });

            it("6.2.1 Investor can not invest zero amount", async function(){

                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 1000);
                // Zero Amount
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 0)).to.revertedWith('CF: Coin is not enough');
            })

            it("6.2.2 Investor can not invest too small amount", async function(){

                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 1000);
                // Token Price 0
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 1000)).to.revertedWith('CF: TOO_SMALL_INVESTMENT');
            })

            it("6.2.3 Investor can invest with token price decided by Bonding Curve Formula", async function(){
                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr1.address, stableCoin.address, 10402, 1022);

                // Invest - Current Supply: 20804 => BuyPrice : 53
                await stableCoin.connect(addr2).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr2).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr2.address, stableCoin.address, 10402, 196);

                // Invest - Current Supply: 31206 => BuyPrice : 137
                await stableCoin.connect(addr3).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr3).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr3.address, stableCoin.address, 10402, 75);
            })

            it("6.2.4 Investor can withdraw funds while ongoing crowdfundingFacet", async function(){
                // Invest - Current Supply: 10402 => BuyPrice : 10
                await stableCoin.connect(addr1).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr1).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr1.address, stableCoin.address, 10402, 1022);

                // Withdraw - received stable coins with fee
                await expect(crowdfundingFacet.connect(addr1).iwithdrawFund(stableCoin.address)).to.emit(crowdfundingFacet, 'IWithdrawFund').withArgs(addr1.address, 10226);

                // No Fund
                await expect(crowdfundingFacet.connect(addr1).iwithdrawFund(stableCoin.address)).to.revertedWith('CF: NO_FUND');
                await expect(crowdfundingFacet.connect(addr2).iwithdrawFund(stableCoin.address)).to.revertedWith('CF: NO_FUND');
            });
        });

        describe("6.3 After finishing crowdfunding with not reached funds to MIN.Threshold", async function () {
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

            it("6.3.1 Investor can not invest after finishing crowdfunding", async function(){
                // Invest not allowed when funding was ended
                await stableCoin.connect(addr2).approve(crowdfundingFacet.address, 10402);
                await expect(crowdfundingFacet.connect(addr2).iinvest(stableCoin.address, 10402)).to.revertedWith('CF: NOT_ONGOING');
            });

            it("6.3.2 Investor can claim funds when the min. funding threshold is not reached within the timeline", async function(){
                await expect(crowdfundingFacet.connect(addr1).ireclaimFund(stableCoin.address)).to.emit(crowdfundingFacet, 'IReclaimFund').withArgs(addr1.address, 10226);
                await expect(crowdfundingFacet.connect(addr1).ireclaimFund(stableCoin.address)).to.revertedWith('CF: NO_FUND');
                await expect(crowdfundingFacet.connect(addr2).ireclaimFund(stableCoin.address)).to.revertedWith('CF: NO_FUND');
            });

            it("6.3.3 Investor can not claim coins when crowdfunding is finished and MIN.Threshold is not reached", async function(){
                await expect(crowdfundingFacet.connect(addr1).iclaimCoin()).to.revertedWith('CF: NOT_REACHED_MIN_THRESHOLD');
            });
        });

        describe("6.4 After finishing crowdfunding with reached funds to MIN.Threshold", async function () {
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
                //
                // // Invest - Current Supply: 31206 => BuyPrice : 137
                // await stableCoin.connect(addr3).approve(crowdfundingFacet.address, 10402);
                // await expect(crowdfundingFacet.connect(addr3).iinvest(stableCoin.address, 10402)).to.emit(crowdfundingFacet, 'IInvest').withArgs(addr3.address, stableCoin.address, 10402, 75);

                // Set Ending Fund
                await crowdfundingFacet.setFundingDuration(0, BEFORE_ONE_HOUR_TIMESTAMP);
            });

            it("6.4.1 Investor can claim coins when crowdfunding is finished and MIN.Threshold is reached", async function(){
                // Receive Project Coin
                // All Funding: 20000
                // All Minted Project Token: 1029 + 194 = 1223
                await expect(crowdfundingFacet.connect(addr1).iclaimCoin()).to.emit(crowdfundingFacet, 'IClaimCoin').withArgs(addr1.address, 16781);
                await expect(crowdfundingFacet.connect(addr2).iclaimCoin()).to.emit(crowdfundingFacet, 'IClaimCoin').withArgs(addr2.address, 3218);
            });

            it("6.4.2 Investor can not claim funds when the min. funding threshold is reached within the timeline", async function(){
                await expect(crowdfundingFacet.connect(addr1).ireclaimFund(stableCoin.address)).to.revertedWith('CF: REACHED_MIN_THRESHOLD');
            });
        });
    })
}
