// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// External contract imports
import {DFWhitelistFacet} from "../facets/DFWhitelistFacet.sol";
import {DFArtifactFacet} from "../facets/DFArtifactFacet.sol";

// Library imports
import {ArenaConstants, WithArenaStorage} from "../libraries/LibArenaStorage.sol";
import {WithStorage} from "../libraries/LibStorage.sol";
import {LibGameUtils} from "../libraries/LibGameUtils.sol";
import {LibDiamond} from "../vendor/libraries/LibDiamond.sol";
// Type imports
import { ArtifactType, DFTCreateArtifactArgs, ArtifactRarity, Artifact, Biome, Spaceships} from "../DFTypes.sol";

contract DFSpaceshipConfigFacet is WithStorage, WithArenaStorage {
    event ArtifactFound(address player, uint256 artifactId, uint256 loc);

    modifier onlyWhitelisted() {
        require(
            DFWhitelistFacet(address(this)).isWhitelisted(msg.sender) ||
                msg.sender == LibDiamond.contractOwner(),
            "Player is not whitelisted"
        );
        _;
    }

    /**
      Gives players spaceships on their home planet. Can only be called once
      by a given player. This is a first pass at getting spaceships into the game.
      Eventually ships will be able to spawn in the game naturally (construction, capturing, etc.)
     */
    function giveSpaceShips(uint256 locationId) public onlyWhitelisted {
        require(!gs().players[msg.sender].claimedShips, "player already claimed ships");
        require(
            gs().planets[locationId].owner == msg.sender && gs().planets[locationId].isHomePlanet,
            "you can only spawn ships on your home planet"
        );

        address owner = gs().planets[locationId].owner;
        if (arenaConstants().SPACESHIPS.mothership) {
            uint256 mothership = createAndPlaceSpaceship(
                locationId,
                owner,
                ArtifactType.ShipMothership
            );
            emit ArtifactFound(msg.sender, mothership, locationId);
        }

        if (arenaConstants().SPACESHIPS.whale) {
            uint256 whale = createAndPlaceSpaceship(
                locationId,
                owner,
                ArtifactType.ShipWhale
            );
            emit ArtifactFound(msg.sender, whale, locationId);
        }

        if (arenaConstants().SPACESHIPS.crescent) {
            uint256 crescent = createAndPlaceSpaceship(
                locationId,
                owner,
                ArtifactType.ShipCrescent
            );
            emit ArtifactFound(msg.sender, crescent, locationId);
        }

        if (arenaConstants().SPACESHIPS.gear) {
            uint256 gear = createAndPlaceSpaceship(
                locationId,
                owner,
                ArtifactType.ShipGear
            );
            emit ArtifactFound(msg.sender, gear, locationId);
        }

        if (arenaConstants().SPACESHIPS.titan) {
            uint256 titan = createAndPlaceSpaceship(
                locationId,
                owner,
                ArtifactType.ShipTitan
            );
            emit ArtifactFound(msg.sender, titan, locationId);
        }

        gs().players[msg.sender].claimedShips = true;
    }

    function createAndPlaceSpaceship(
        uint256 planetId,
        address owner,
        ArtifactType shipType
    ) private returns (uint256) {
        require(shipType <= ArtifactType.ShipTitan && shipType >= ArtifactType.ShipMothership);

        uint256 id = uint256(keccak256(abi.encodePacked(planetId, gs().miscNonce++)));

        DFTCreateArtifactArgs memory createArtifactArgs = DFTCreateArtifactArgs(
            id,
            msg.sender,
            planetId,
            ArtifactRarity.Unknown,
            Biome.Unknown,
            shipType,
            address(this),
            owner
        );

        Artifact memory foundArtifact = DFArtifactFacet(address(this)).createArtifact(
            createArtifactArgs
        );
        LibGameUtils._putArtifactOnPlanet(foundArtifact.id, planetId);

        return id;
    }
}
