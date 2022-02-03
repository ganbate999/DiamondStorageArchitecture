import {expect} from "chai";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {AFTER_ONE_HOUR_TIMESTAMP, getTimestamp, TIMESTAMP_NOW} from "../../helper";

const BEFORE_ONE_MINUTE_TIMESTAMP = getTimestamp(new Date()) - 60;
const AFTER_ONE_MINUTE_TIMESTAMP = getTimestamp(new Date()) + 60;

export function shouldBehaveLikeSetProps(): void {
    describe("5. Setting Crowdfunding Props by Project Owner", async function () {
        let crowdfundingFacet: Contract;
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;

        beforeEach(async () => {
            [owner, addr1, addr2] = this.ctx.signers;
            crowdfundingFacet = this.ctx.crowdfundingFacet;
        });

        it("5.1 Only project owner can set funding duration", async function () {
            // only owner
            await expect(crowdfundingFacet.connect(addr1).setFundingDuration(BEFORE_ONE_MINUTE_TIMESTAMP, AFTER_ONE_MINUTE_TIMESTAMP)).to.revertedWith('LibDiamond: Must be contract owner');

            // set duration
            crowdfundingFacet.setFundingDuration(BEFORE_ONE_MINUTE_TIMESTAMP, AFTER_ONE_MINUTE_TIMESTAMP);

            // set duration on ongoing status
            await expect(crowdfundingFacet.setFundingDuration(TIMESTAMP_NOW, AFTER_ONE_HOUR_TIMESTAMP)).to.revertedWith('CF: ALREADY_STARTED');
        });

        it("5.2 Only project owner can set min.threshold", async function () {
            // not allow zero
            await expect(crowdfundingFacet.setMinFundingThreshold(0)).to.revertedWith('CF: MIN>0');

            // set Min.Threshold
            await crowdfundingFacet.setMinFundingThreshold(10000);

            // Only Owner
            await expect(crowdfundingFacet.connect(addr1).setMinFundingThreshold(10000)).to.revertedWith('LibDiamond: Must be contract owner');
        });

        it("5.3 Only project owner can set project owner address", async function () {
            // set project owner address
            await crowdfundingFacet.setProjectOwnerAddr(addr2.address);
            expect(await crowdfundingFacet.projectOwnerAddr()).to.eq(addr2.address);

            // Only Owner
            await expect(crowdfundingFacet.connect(addr2).setProjectOwnerAddr(addr1.address)).to.revertedWith('LibDiamond: Must be contract owner');
        });
    });
}
