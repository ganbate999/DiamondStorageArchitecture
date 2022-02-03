import { expect } from "chai";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {FUNDING_COIN_SUPPLY} from "../../helper";

export function shouldBehaveLikeBondingCurve(): void {
    describe("4. Bonding Curve", async function () {
        let crowdfundingFacet: Contract;
        let owner: SignerWithAddress;

        beforeEach(async () => {
            [owner] = this.ctx.signers;
            crowdfundingFacet = this.ctx.crowdfundingFacet;

            /// Allocate Funding Project Coin to CrowdFunding
            await this.ctx.projectCoin.approve(crowdfundingFacet.address, FUNDING_COIN_SUPPLY);
            await crowdfundingFacet.allocateSupply(FUNDING_COIN_SUPPLY);
        });

        it("4.1 Succeeds in getting buy price", async function () {
            for(let i=10402; i<120000; i+= 10402){
                const price1 = await crowdfundingFacet.getBuyPrice(Math.floor(i ));
                console.log('price: ', Number(i), ':',  price1);
            }
            expect(await crowdfundingFacet.getBuyPrice(10402)).to.eq(10);
            expect(await crowdfundingFacet.getBuyPrice(24593)).to.eq(80);
            expect(await crowdfundingFacet.getBuyPrice(46890)).to.eq(365);
            expect(await crowdfundingFacet.getBuyPrice(89402)).to.eq(1645);
            expect(await crowdfundingFacet.getBuyPrice(137465)).to.eq(4491);
            expect(await crowdfundingFacet.getBuyPrice(211366)).to.eq(12323);
        });

        it("4.2 Succeeds in getting sell price", async function () {
            for(let i=10402; i<120000; i*= 1.24){
                const price1 = await crowdfundingFacet.getSellPrice(Math.floor(i));
                console.log('price: ', Number(i), ':',  price1);
            }
            expect(await crowdfundingFacet.getSellPrice(10402)).to.eq(9);
            expect(await crowdfundingFacet.getSellPrice(24593)).to.eq(72);
            expect(await crowdfundingFacet.getSellPrice(46890)).to.eq(328);
            expect(await crowdfundingFacet.getSellPrice(89402)).to.eq(1480);
            expect(await crowdfundingFacet.getSellPrice(137465)).to.eq(4041);
            expect(await crowdfundingFacet.getSellPrice(211366)).to.eq(11090);
        });
    });
}
