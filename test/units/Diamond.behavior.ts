import {assert, expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from 'ethers';
import {ethers} from "hardhat";
import {deployDiamond} from "../diamond";
const {getSelectors, findAddressPositionInFacets} = require("../../deployment/libraries/diamond");

export function likeDiamond(): void {
    describe("- Diamond", async function() {
        let owner: SignerWithAddress;
        let addr1: SignerWithAddress;
        let addr2: SignerWithAddress;
        let crowdfundingDiamond: string;
        let diamondCutFacet: Contract;
        let crowdfundingFacet: Contract;
        let diamondLoupeFacet: Contract;
        let ownershipFacet: Contract;
        let pausableFacet: Contract;
        let bondfundingFacet: Contract;
        let addresses: string[] = [];

        before(async () => {
            [owner, addr1, addr2] = await ethers.getSigners();

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

            diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', crowdfundingDiamond);
            diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', crowdfundingDiamond);
            ownershipFacet = await ethers.getContractAt('OwnershipFacet', crowdfundingDiamond);
            pausableFacet = await ethers.getContractAt('PausableFacet', crowdfundingDiamond);
            crowdfundingFacet = await ethers.getContractAt('CrowdfundingFacet', crowdfundingDiamond);
            bondfundingFacet = await ethers.getContractAt('BondfundingFacet', crowdfundingDiamond);
        });

        it('should have six facets -- call to facetAddresses function', async () => {
            for (const address of await diamondLoupeFacet.facetAddresses()) {
                addresses.push(address)
            }
            assert.equal(addresses.length, 6)
        })

        it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
            let selectors = getSelectors(diamondCutFacet)
            let result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
            assert.sameMembers(result, selectors.signatures)
            selectors = getSelectors(diamondLoupeFacet)
            result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
            assert.sameMembers(result, selectors.signatures)
            selectors = getSelectors(ownershipFacet)
            result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
            assert.sameMembers(result, selectors.signatures)
            selectors = getSelectors(pausableFacet)
            result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
            assert.sameMembers(result, selectors.signatures)
            selectors = getSelectors(crowdfundingFacet)
            result = await diamondLoupeFacet.facetFunctionSelectors(addresses[4])
            assert.sameMembers(result, selectors.signatures)
            selectors = getSelectors(bondfundingFacet)
            result = await diamondLoupeFacet.facetFunctionSelectors(addresses[5])
            assert.sameMembers(result, selectors.signatures)
        })

        it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
            assert.equal(
                addresses[0],
                await diamondLoupeFacet.facetAddress('0x1f931c1c')
            )
            assert.equal(
                addresses[1],
                await diamondLoupeFacet.facetAddress('0xcdffacc6')
            )
            assert.equal(
                addresses[1],
                await diamondLoupeFacet.facetAddress('0x01ffc9a7')
            )
            assert.equal(
                addresses[2],
                await diamondLoupeFacet.facetAddress('0xf2fde38b')
            )
            assert.equal(
                addresses[3],
                await diamondLoupeFacet.facetAddress('0x5c975abb')
            )
            assert.equal(
                addresses[4],
                await diamondLoupeFacet.facetAddress('0x25cfafa6')
            )
            assert.equal(
                addresses[5],
                await diamondLoupeFacet.facetAddress('0xc28f4392')
            )
        });
        it('add most functions and facets', async () => {
            const facets = await diamondLoupeFacet.facets();
            assert.equal(addresses.length, 6)
            assert.equal(facets.length, 6)
            assert.equal(facets[0][0], addresses[0], 'first facet')
            assert.equal(facets[1][0], addresses[1], 'second facet')
            assert.equal(facets[2][0], addresses[2], 'third facet')
            assert.equal(facets[3][0], addresses[3], 'fourth facet')
            assert.equal(facets[4][0], addresses[4], 'fifth facet')
            assert.equal(facets[5][0], addresses[5], 'sixth facet')
            assert.sameMembers(facets[findAddressPositionInFacets(addresses[0], facets)][1], getSelectors(diamondCutFacet).signatures)
            assert.sameMembers(facets[findAddressPositionInFacets(addresses[1], facets)][1], getSelectors(diamondLoupeFacet).signatures)
            assert.sameMembers(facets[findAddressPositionInFacets(addresses[2], facets)][1], getSelectors(ownershipFacet).signatures)
            assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(pausableFacet).signatures)
            assert.sameMembers(facets[findAddressPositionInFacets(addresses[4], facets)][1], getSelectors(crowdfundingFacet).signatures)
            assert.sameMembers(facets[findAddressPositionInFacets(addresses[5], facets)][1], getSelectors(bondfundingFacet).signatures)
        });
    });
}