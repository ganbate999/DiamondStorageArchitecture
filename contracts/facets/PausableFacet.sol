// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibCFDiamond} from "../libraries/LibCFDiamond.sol";
import { IERC173 } from "../interfaces/IERC173.sol";

contract PausableFacet {
    /**
 * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    function paused() external view returns (bool paused_) {
        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        paused_ = ds._paused;
    }

    /**
    * ****************************************
    *
    * Implemented from Pausable
    * ****************************************
    */

    /// @notice Pause contract
    function pause() external {
        LibCFDiamond.enforceIsContractOwner();
        LibCFDiamond.whenNotPaused();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        ds._paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause contract
    function unpause() external {
        LibCFDiamond.enforceIsContractOwner();
        LibCFDiamond.whenPaused();

        LibCFDiamond.DiamondStorage storage ds = LibCFDiamond.diamondStorage();
        ds._paused = false;
        emit Unpaused(msg.sender);
    }
}
