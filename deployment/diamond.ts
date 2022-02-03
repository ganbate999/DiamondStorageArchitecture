/* global ethers */
/* eslint prefer-const: "off" */

import {HardhatEthersHelpers} from "@nomiclabs/hardhat-ethers/types";
import {Contract} from "ethers";

const FacetCutAction = {Add: 0, Replace: 1, Remove: 2}

function getSelectors(contract: Contract) {
    const signatures = Object.keys(contract.interface.functions)
    return signatures.reduce((acc: string[], val: string) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val))
        }
        return acc
    }, [])
}

export async function deployDiamond (ethers: HardhatEthersHelpers, projectName: string, coinAddr: string, stAddr: string, projectFee: number) {
    const accounts = await ethers.getSigners()
    const contractOwner = accounts[0]

    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    const diamondCutFacet = await DiamondCutFacet.deploy()
    await diamondCutFacet.deployed()
    console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

    // deploy Diamond
    const Diamond = await ethers.getContractFactory('CFDiamond')
    const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address)
    await diamond.deployed()
    console.log('Diamond deployed:', diamond.address)

    // deploy InitDiamond
    // InitDiamond provides a function that is called when the diamond is upgraded to initialize state variables
    // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
    const InitDiamond = await ethers.getContractFactory('InitDiamond')
    const diamondInit = await InitDiamond.deploy()
    await diamondInit.deployed()
    console.log('InitDiamond deployed:', diamondInit.address)

    // deploy facets
    console.log('Deploying facets')
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
        console.log(`${FacetName} deployed: ${facet.address}`)
        cut.push({
            facetAddress: facet.address,
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(facet)
        })
    }

    // upgrade diamond with facets
    console.log('Diamond Cut:', cut)
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
    let tx
    let receipt
    // call to init function
    let functionCall = diamondInit.interface.encodeFunctionData('init')
    tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
    //console.log('Diamond cut tx: ', tx.hash)
    receipt = await tx.wait()
    if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    //console.log('Completed diamond cut')

    return diamond.address
}
