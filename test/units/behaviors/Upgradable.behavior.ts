import {assert, expect} from "chai";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {AFTER_ONE_HOUR_TIMESTAMP, TIMESTAMP_NOW} from "../../helper";
const { ethers } = require('hardhat');
const {getSelectors, FacetCutAction} = require("../../../deployment/libraries/diamond");

export function shouldBehaveLikeUpgradeable(): void {
    describe("3. Upgradable", async function () {
        let diamondCutFacet: Contract;
        let diamondLoupeFacet: Contract;
        let test1Facet: Contract;
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;

        beforeEach(async () => {
            [owner, addr1] = this.ctx.signers;
            diamondCutFacet = this.ctx.diamondCutFacet;
            diamondLoupeFacet = this.ctx.diamondLoupeFacet;

            const Test1Facet = await ethers.getContractFactory('Test1Facet')
            test1Facet = await Test1Facet.deploy()
            await test1Facet.deployed();
        });

        // describe("3.1 Constructor", async function () {
        //     it("3.1,1 Fails when the constructor is modified by admin", async function () {
        //
        //     });
        //
        //     it("3.1.2 Fails when the constructor is modified by non-admin", async function () {
        //
        //     });
        // });
        //
        // describe("3.2 Inheritance", async function () {
        //     it("3.2.1 Succeeds when contract inherits from a new contract by admin", async function () {
        //
        //     });
        //
        //     it("3.2.2 Fails when contract inherits from an existing contract by admin", async function () {
        //
        //     });
        //
        //     it("3.2.3 Fails when contract inherits from a new contract by non-admin", async function () {
        //
        //     });
        //
        //     it("3.2.4 Fails when contract inherits from an existing contract by non-admin", async function () {
        //
        //     });
        // });
        //
        // describe("3.3 State variable", async function () {
        //     it("3.3.1 Verify if the stored data for public variable is reinstated", async function () {
        //
        //     });
        //
        //     it("3.3.2 Succeeds when the admin add a new state variable", async function () {
        //
        //     });
        //
        //     it("3.3.3 Succeeds when the admin remove an existing state variable", async function () {
        //
        //     });
        //
        //     it("3.3.4 Fails when the non-admin add a new state variable", async function () {
        //
        //     });
        //
        //     it("3.3.5 Fails when the non-admin remove an existing state variable", async function () {
        //
        //     });
        // });
        //
        // describe("3.4 Event", async function () {
        //     it("3.4.1 Succeeds when the admin add a new event", async function () {
        //
        //     });
        //
        //     it("3.4.2 Succeeds when the admin modify an existing event by adding or removing parameters", async function () {
        //
        //     });
        //
        //     it("3.4.3 Fails when the admin creates a duplicate event", async function () {
        //
        //     });
        //
        //     it("3.4.4 Fails when the non-admin add a new event", async function () {
        //
        //     });
        //
        //     it("3.4.5 Fails when the non-admin modify an existing event by adding or removing parameters", async function () {
        //
        //     });
        //
        //     it("3.4.6 Fails when the non-admin creates a duplicate event", async function () {
        //
        //     });
        // });
        //
        // describe("3.5 Modifier", async function () {
        //     it("3.5.1 Succeeds when the admin add a new modifier", async function () {
        //
        //     });
        //
        //     it("3.5.2 Succeeds when the admin modify an existing modifier", async function () {
        //
        //     });
        //
        //     it("3.5.3 Succeeds when the admin remove an existing modifier", async function () {
        //
        //     });
        //
        //     it("3.5.4 Fails when the non-admin add a new modifier", async function () {
        //
        //     });
        //
        //     it("3.5.5 Fails when the non-admin modify an existing modifier", async function () {
        //
        //     });
        //
        //     it("3.5.6 Fails when the non-admin remove an existing modifier", async function () {
        //
        //     });
        // });

        describe("3.6 Function", async function () {
            it("3.6.1 Succeeds when the admin add a new function", async function () {
                const selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)']).signatures;
                let tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                let receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }
                let result = await diamondLoupeFacet.facetFunctionSelectors(test1Facet.address)
                assert.sameMembers(result, selectors)
            });

            it("3.6.2 Succeeds when the admin modify an existing function", async function () {
                let selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)']).signatures;
                let tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                let receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }
                selectors = getSelectors(test1Facet).get(['supportsInterface(bytes4)']).signatures
                tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Replace,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }
                let result = await diamondLoupeFacet.facetFunctionSelectors(test1Facet.address)
                assert.sameMembers(result, getSelectors(test1Facet).signatures)
            });

            it("3.6.3 Succeeds when the admin remove an existing function", async function () {
                let selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)']).signatures;
                let tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                let receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }

                const functionsToKeep = ['test1Func2()', 'test1Func3()'];
                selectors = getSelectors(test1Facet).remove(functionsToKeep).signatures;
                tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: ethers.constants.AddressZero,
                        action: FacetCutAction.Remove,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }
                let result = await diamondLoupeFacet.facetFunctionSelectors(test1Facet.address)
                assert.sameMembers(result, getSelectors(test1Facet).get(functionsToKeep).signatures)
            });

            it("3.6.4 Fails when the non-admin add a new function", async function () {
                const selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)']).signatures;
                await expect(diamondCutFacet.connect(addr1).diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })).to.revertedWith('LibDiamond: Must be contract owner');
            });

            it("3.6.5 Fails when the non-admin update an existing function", async function () {
                let selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)']).signatures;;
                let tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                let receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }
                selectors = getSelectors(test1Facet).get(['supportsInterface(bytes4)']).signatures
                await expect(diamondCutFacet.connect(addr1).diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Replace,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })).to.revertedWith('LibDiamond: Must be contract owner');
            });

            it("3.6.6 Fails when the non-admin remove an existing function", async function () {
                let selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)']).signatures;
                let tx = await diamondCutFacet.diamondCut(
                    [{
                        facetAddress: test1Facet.address,
                        action: FacetCutAction.Add,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
                let receipt = await tx.wait()
                if (!receipt.status) {
                    throw Error(`Diamond upgrade failed: ${tx.hash}`)
                }

                const functionsToKeep = ['test1Func2()', 'test1Func3()'];
                selectors = getSelectors(test1Facet).remove(functionsToKeep).signatures;
                await expect(diamondCutFacet.connect(addr1).diamondCut(
                    [{
                        facetAddress: ethers.constants.AddressZero,
                        action: FacetCutAction.Remove,
                        functionSelectors: selectors
                    }],
                    ethers.constants.AddressZero, '0x', { gasLimit: 800000 })).to.revertedWith('LibDiamond: Must be contract owner');
            });
        });
    });
}
