import { expect } from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';

export function shouldBehaveLikeOwnable(): void {
    describe("1. Ownable", async function() {
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;
        let ownershipFacet: Contract;

        beforeEach(async () => {
            [owner, addr1, addr2] = this.ctx.signers;
            ownershipFacet = this.ctx.ownershipFacet;
        });

        it("1.1 Succeeds when owner transfers ownership", async () => {

            await expect(ownershipFacet.transferOwnership(addr1.address))
                .to.emit(ownershipFacet, 'OwnershipTransferred')

        });


        it("1.2 Fails when non-owner transfers ownership", async () => {

            await ownershipFacet.transferOwnership(addr1.address);

            await expect(ownershipFacet.transferOwnership(addr2.address))
                .to.be.revertedWith('LibDiamond: Must be contract owner')
        });

    });
}
