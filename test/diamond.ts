/* global ethers */
/* eslint prefer-const: "off" */
import {ethers} from "hardhat";

const { getSelectors, FacetCutAction } = require('../deployment/libraries/diamond')

const PROJECT_NAME = "MyFunding";
const PROJECT_OWNER_FEE = 70;

export async function deployDiamond (coinAddr: string, stAddr: string) {
    const accounts = await ethers.getSigners()
    const contractOwner = accounts[0]

    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    const diamondCutFacet = await DiamondCutFacet.deploy()
    await diamondCutFacet.deployed()
    // console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

    // deploy Diamond
    const Diamond = await ethers.getContractFactory('CFDiamond')
    const diamond = await Diamond.deploy(contractOwner.address, PROJECT_NAME, coinAddr, stAddr, PROJECT_OWNER_FEE, diamondCutFacet.address)
    await diamond.deployed()
    // console.log('Diamond deployed:', diamond.address)

    // deploy InitDiamond
    // InitDiamond provides a function that is called when the diamond is upgraded to initialize state variables
    // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
    const InitDiamond = await ethers.getContractFactory('InitDiamond')
    const diamondInit = await InitDiamond.deploy()
    await diamondInit.deployed()
    // console.log('InitDiamond deployed:', diamondInit.address)

    // deploy facets
    // console.log('Deploying facets')
    const FacetNames = [
        'DiamondLoupeFacet',
        'OwnershipFacet',
        'PausableFacet',
        'CrowdfundingFacet',
        'BondfundingFacet',
    ]
    const cut = []
    for (const FacetName of FacetNames) {
        const Facet = await ethers.getContractFactory(FacetName)
        const facet = await Facet.deploy()
        await facet.deployed()
        //console.log(`${FacetName} deployed: ${facet.address}`)
        //console.log(`${FacetName} signatures: ${getSelectors(facet).signatures}`)
        cut.push({
            facetAddress: facet.address,
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(facet).signatures
        })
    }

    // upgrade diamond with facets
    //console.log('Diamond Cut:', cut)
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
    // call to init function
    let functionCall = diamondInit.interface.encodeFunctionData('init')
    let tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
    //console.log('Diamond cut tx: ', tx.hash)
    let receipt = await tx.wait()
    if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    //console.log('Completed diamond cut')

    return diamond.address
}
