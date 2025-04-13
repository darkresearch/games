// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// Contract imports
import {Diamond} from "../vendor/Diamond.sol";

// Interface imports
import {IDiamondCut} from "../vendor/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../vendor/interfaces/IDiamondLoupe.sol";
import {IERC173} from "../vendor/interfaces/IERC173.sol";

// Storage imports
import {WithStorage} from "../libraries/LibStorage.sol";
import {WithArenaStorage} from "../libraries/LibArenaStorage.sol";

contract DFArenaTournamentFacet is WithStorage, WithArenaStorage {
    event LobbyCreated(address creatorAddress, address lobbyAddress);

    function createLobby(address initAddress, bytes calldata initData) public {
        address diamondAddress = gs().diamondAddress;
        address diamondCutAddress = IDiamondLoupe(diamondAddress).facetAddress(
            IDiamondCut.diamondCut.selector
        );
        Diamond lobby = new Diamond(diamondAddress, diamondCutAddress);

        IDiamondLoupe.Facet[] memory facets = IDiamondLoupe(diamondAddress).facets();

        IDiamondCut.FacetCut[] memory facetCut = new IDiamondCut.FacetCut[](facets.length - 1);
        uint256 cutIdx = 0;
        for (uint256 i = 0; i < facets.length; i++) {
            if (facets[i].facetAddress != diamondCutAddress) {
                facetCut[cutIdx] = IDiamondCut.FacetCut({
                    facetAddress: facets[i].facetAddress,
                    action: IDiamondCut.FacetCutAction.Add,
                    functionSelectors: facets[i].functionSelectors
                });
                cutIdx++;
            }
        }

        IDiamondCut(address(lobby)).diamondCut(facetCut, initAddress, initData);

        if (IERC173(address(lobby)).owner() == diamondAddress) {
            IERC173(address(lobby)).transferOwnership(msg.sender);
        }

        emit LobbyCreated(msg.sender, address(lobby));

        tournamentStorage().matches.push(address(lobby));
        tournamentStorage().numMatches += 1;
    }
}
