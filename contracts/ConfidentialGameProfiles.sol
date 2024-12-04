// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ConfidentialERC1155 } from "./ConfidentialERC1155Standard/ConfidentialERC1155/ConfidentialERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "fhevm/lib/TFHE.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ConfidentialGameProfiles is ConfidentialERC1155, Ownable {
    // Token IDs for swords
    uint256 public constant SwordGold = 100;
    uint256 public constant SwordSilver = 101;
    uint256 public constant SwordDiamond = 102;

    // Token IDs for potions
    uint256 public constant HealthPotion = 200;
    uint256 public constant PoisonPotion = 201;
    uint256 public constant ManaPotion = 202;

    // Token ID for encrypted gold coin balance
    uint256 public constant GoldCoins = 1;

    uint256 public tokenIdCounter;

    constructor()
        ConfidentialERC1155(
            "https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/{id}.json"
        )
        Ownable(msg.sender)
    {}

    function formPlayer(
        uint256 swordId,
        uint256 potionId,
        einput[] memory encryptedPlayerInfo,
        bytes memory inputProof
    ) external {
        mint(msg.sender, swordId, TFHE.asEuint64(encryptedPlayerInfo[0], inputProof), "");
        mint(msg.sender, potionId, TFHE.asEuint64(encryptedPlayerInfo[1], inputProof), "");
        mint(msg.sender, GoldCoins, TFHE.asEuint64(encryptedPlayerInfo[2], inputProof), "");
    }

    function mint(address to, uint256 id, euint64 encryptedAmount, bytes memory data) internal {
        _mint(to, id, encryptedAmount, data);
    }

    function getTokenIdCounter() external view returns (uint256) {
        return tokenIdCounter;
    }

    // Example function to get URI for a specific token ID
    function uri(uint256 id) public pure override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/",
                    Strings.toString(id),
                    ".json"
                )
            );
    }
}
