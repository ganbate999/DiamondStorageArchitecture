import { expect } from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

export function shouldBehaveLikePausable(): void {
    describe("2. Pausable", async function() {
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;
        let pausableFacet: Contract;

        beforeEach(async () =>{
            [owner, addr1, addr2] = this.ctx.signers;
            pausableFacet = this.ctx.pausableFacet;
        });


        it("2.1 Succeeds if owner pause when NOT paused", async () => {
            await expect(pausableFacet.pause())
                .to.emit(pausableFacet, 'Paused')
                .withArgs(owner.address);
        });


        it("2.2 Succeeds if owner unpause when already paused", async () => {
            await pausableFacet.pause();

            await expect(pausableFacet.unpause())
                .to.emit(pausableFacet, 'Unpaused')
                .withArgs(owner.address);
        });

        it("2.3 Fails if owner pause when already paused", async () => {
            await pausableFacet.pause();

            await expect(pausableFacet.pause())
                .to.be.revertedWith("Pausable: paused");
        });

        it("2.4 Fails if owner unpause when already unpaused", async () => {
            await pausableFacet.pause();

            await pausableFacet.unpause();

            await expect(pausableFacet.unpause())
                .to.be.revertedWith("Pausable: not paused");
        });

        it("2.5 Fails if non-owner pause when NOT paused", async () => {
            await expect(pausableFacet.connect(addr1).pause())
                .to.be.revertedWith("LibDiamond: Must be contract owner");
        });

        it("2.6 Fails if non-owner unpause when already paused", async () => {
            await pausableFacet.pause();

            await expect(pausableFacet.connect(addr1).unpause())
                .to.be.revertedWith("LibDiamond: Must be contract owner");
        });
    });
}
