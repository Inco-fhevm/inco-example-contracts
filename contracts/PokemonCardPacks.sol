// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "fhevm/lib/TFHE.sol";

/// @title PokemonCardPacks
/// @dev A simple ERC721 contract for Pokémon card packs using OpenZeppelin
contract PokemonCardPacks is ERC721, Ownable {
    // Counter to keep track of token IDs
    uint256 private _tokenIdCounter;

    // Mapping to store metadata URIs for each card pack
    mapping(uint256 => string) private _tokenURIs;

    // Mapping to store encrypted keys for Encrypted URI's
    mapping(uint256 => euint64) private _encryptedKeys;

    /// @dev Constructor to initialize the contract
    constructor() ERC721("PokemonCardPacks", "PCP") Ownable(msg.sender) {}

    /// @notice Mint a new Pokémon card pack
    /// @param to The address to receive the card pack
    /// @param _tokenURI The metadata URI for the card pack
    function mint(
        address to,
        string calldata _tokenURI,
        einput encryptedKey,
        bytes calldata inputProof
    ) public onlyOwner {
        // Increment the token ID counter
        _tokenIdCounter++;

        // Mint the new card pack
        uint256 newTokenId = _tokenIdCounter;
        _mint(to, newTokenId);

        // Set the metadata URI for the card pack
        _setTokenURI(newTokenId, _tokenURI);

        _setEncrypteKeyForTokenUri(to, newTokenId, TFHE.asEuint64(encryptedKey, inputProof));
    }

    function _setEncrypteKeyForTokenUri(address to, uint256 _tokenId, euint64 _key) internal {
        _encryptedKeys[_tokenId] = _key;
        TFHE.allow(_encryptedKeys[_tokenId], address(this));
        TFHE.allow(_encryptedKeys[_tokenId], owner());
        TFHE.allow(_encryptedKeys[_tokenId], to);
    }

    /// @notice Get the metadata URI for a specific token
    /// @param tokenId The ID of the token
    /// @return The metadata URI for the token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    /// @dev Internal function to check if a token exists
    /// @param tokenId The ID of the token
    /// @return True if the token exists, false otherwise
    function _exists(uint256 tokenId) internal view returns (bool) {
        return bytes(_tokenURIs[tokenId]).length > 0;
    }

    /// @dev Internal function to set the metadata URI for a token
    /// @param tokenId The ID of the token
    /// @param _tokenURI The metadata URI to set
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        _tokenURIs[tokenId] = _tokenURI;
    }

    function getKey(uint256 tokenId) external view returns (euint64) {
        return _encryptedKeys[tokenId];
    }
}
