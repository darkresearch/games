// SPDX-License-Identifier: GPL-3.0 AND MIT
/**
 * Customized version of DiamondInit.sol
 *
 * Vendored on November 16, 2021 from:
 * https://github.com/mudgen/diamond-3-hardhat/blob/7feb995/contracts/upgradeInitializers/DiamondInit.sol
 */
pragma solidity ^0.8.0;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

// It is expected that this contract is customized in order to deploy a diamond with data
// from a deployment script. The init function is used to initialize state variables
// of the diamond. Add parameters to the init function if you need to.

// Interface imports
import {IDiamondLoupe} from "./vendor/interfaces/IDiamondLoupe.sol";
import {IDiamondCut} from "./vendor/interfaces/IDiamondCut.sol";
import {IERC173} from "./vendor/interfaces/IERC173.sol";
import {IERC165} from "@solidstate/contracts/introspection/IERC165.sol";
import {IERC721} from "@solidstate/contracts/token/ERC721/IERC721.sol";
import {IERC721Metadata} from "@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol";
import {IERC721Enumerable} from "@solidstate/contracts/token/ERC721/enumerable/IERC721Enumerable.sol";

// Inherited storage
import {ERC721MetadataStorage} from "@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol";

// Library imports
import {LibDiamond} from "./vendor/libraries/LibDiamond.sol";
import {WithStorage} from "./libraries/LibStorage.sol";
import {WithArenaStorage} from "./libraries/LibArenaStorage.sol";
import {LibGameUtils} from "./libraries/LibGameUtils.sol";

// Contract imports 
import {DFWhitelistFacet} from "./facets/DFWhitelistFacet.sol";

// Type imports
import {PlanetDefaultStats, Upgrade, UpgradeBranch, Modifiers, Mod, ArenaCreateRevealPlanetArgs, InitArgs, AuxiliaryArgs, Spaceships} from "./DFTypes.sol";

contract DFArenaInitialize is WithStorage, WithArenaStorage {
    using ERC721MetadataStorage for ERC721MetadataStorage.Layout;

    // You can add parameters to this function in order to pass in
    // data to set initialize state variables
    function init(
        InitArgs calldata initArgs,
        AuxiliaryArgs calldata auxArgs
    ) external {        
        // adding ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
        ds.supportedInterfaces[type(IERC721).interfaceId] = true;
        ds.supportedInterfaces[type(IERC721Metadata).interfaceId] = true;
        ds.supportedInterfaces[type(IERC721Enumerable).interfaceId] = true;

        // Setup the ERC721 metadata
        // TODO(#1925): Add name and symbol for the artifact tokens
        ERC721MetadataStorage.layout().name = "";
        ERC721MetadataStorage.layout().symbol = "";
        ERC721MetadataStorage.layout().baseURI = auxArgs.artifactBaseURI;

        /* 
            Setting the diamond address is necessary because createLobby uses it to make new Arenas
        */

        gs().diamondAddress = address(this);

        /* Store init values to be added to game storage */
        ai().initArgs = initArgs;
        ai().auxArgs = auxArgs;

        /* 
            Transferring ownership here is necessary because contract owner needs to do it.
        */
        if(initArgs.NO_ADMIN) {
            (bool success, bytes memory returndata) = address(this).delegatecall(abi.encodeWithSignature("transferOwnership(address)", address(0)));
            require(success, "transfer ownership did not succeed");
        }
    }
}
