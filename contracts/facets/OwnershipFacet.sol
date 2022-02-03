// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibCFDiamond} from "../libraries/LibCFDiamond.sol";
import { IERC173 } from "../interfaces/IERC173.sol";

contract OwnershipFacet is IERC173 {
    function transferOwnership(address _newOwner) external override {
        LibCFDiamond.enforceIsContractOwner();
        LibCFDiamond.setContractOwner(_newOwner);
    }

    function owner() external override view returns (address owner_) {
        owner_ = LibCFDiamond.contractOwner();
    }
}
