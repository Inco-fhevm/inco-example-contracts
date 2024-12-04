import { expect } from "chai";

import { asyncDecrypt, awaitAllDecryptionResults } from "../asyncDecrypt";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployConfidentialERC721 } from "./ConfidentialERC721.fixture";

const crypto = require("crypto");
const fs = require("fs");

describe("ConfidentialERC721 Tests", function () {
  before(async function () {
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    this.instances = await createInstances(this.signers);
    this.ConfidentialERC721 = await deployConfidentialERC721();
    this.contractAddress = await this.ConfidentialERC721.getAddress();
  });

  it("Should be able to open pokemon cards and decrypt metadata", async function () {
    const { signers, ConfidentialERC721 } = this;

    // Step 1: Generate AES Key (8 Bytes for 64-bit encryption key)
    const aesKeyBytes = crypto.randomBytes(8); // 64-bit key
    const aesKeyUint64 = BigInt(`0x${aesKeyBytes.toString("hex")}`);
    console.log("Generated AES Key (uint64):", aesKeyUint64.toString());

    // Step 2: Create Metadata for Pokemon Card
    const metadata = {
      name: "Pikachu Card",
      description: "A rare Pikachu card.",
      image: "https://example.com/pikachu.png",
      attributes: [{ trait_type: "Power", value: "50" }],
    };

    // Step 3: Encrypt Metadata
    const iv = crypto.randomBytes(16); // 16-byte Initialization vector (128 bits)
    const keyPadded = Buffer.concat([aesKeyBytes, Buffer.alloc(8)]); // Pad key to 16 bytes for AES
    const cipher = crypto.createCipheriv("aes-128-cbc", keyPadded, iv); // AES requires a 16-byte key
    let encrypted = cipher.update(JSON.stringify(metadata), "utf8", "hex");
    encrypted += cipher.final("hex");

    const encryptedMetadata = {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
    };
    console.log("Encrypted Metadata:", encryptedMetadata);

    // Step 4: Save Encrypted Metadata Locally
    const filename = "./encrypted_pokemon_card.json";
    fs.writeFileSync(filename, JSON.stringify(encryptedMetadata, null, 2));

    // Step 5: Use Sample IPFS URI
    const ipfsURI = "ipfs://sample-placeholder-uri";
    console.log("Sample IPFS URI:", ipfsURI);

    // Step 6: Encrypt Key and Store On-Chain
    const input = await this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    input.add64(aesKeyUint64); // Add AES Key as uint64
    const encryptedKey = await input.encrypt();

    const tx = await ConfidentialERC721.mint(
      this.signers.alice.address,
      ipfsURI,
      encryptedKey.handles[0],
      encryptedKey.inputProof,
      { gasLimit: 5000000 }
    );
    await tx.wait();
    console.log("NFT minted with URI and key stored on-chain:", ipfsURI);

    // Step 7: Retrieve and Verify Key On-Chain
    const storedKey = await ConfidentialERC721.getKey(1); // Assuming token ID 1
    const { publicKey: publicKeyAlice, privateKey: privateKeyAlice } = this.instances.alice.generateKeypair();
    const eip712ForAlice = this.instances.alice.createEIP712(publicKeyAlice, this.contractAddress);
    const signatureAlice = await this.signers.alice.signTypedData(
      eip712ForAlice.domain,
      { Reencrypt: eip712ForAlice.types.Reencrypt },
      eip712ForAlice.message
    );

    const retrievedKey = await this.instances.alice.reencrypt(
      storedKey,
      privateKeyAlice,
      publicKeyAlice,
      signatureAlice.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address
    );
    expect(retrievedKey).to.equal(aesKeyUint64);

    // Step 8: Decrypt Metadata Locally Using Retrieved Key
    const retrievedKeyBuffer = Buffer.from(retrievedKey.toString(16).padStart(16, "0"), "hex"); // Convert to buffer
    const keyPaddedFromRetrieved = Buffer.concat([retrievedKeyBuffer, Buffer.alloc(8)]); // Pad to 16 bytes
    const decipher = crypto.createDecipheriv(
      "aes-128-cbc",
      keyPaddedFromRetrieved,
      Buffer.from(encryptedMetadata.iv, "hex")
    );
    let decrypted = decipher.update(encryptedMetadata.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const decryptedMetadata = JSON.parse(decrypted);
    console.log("Decrypted Metadata:", decryptedMetadata);

    // Step 9: Cross-check URI
    const tokenURI = await ConfidentialERC721.tokenURI(1); // Assuming token ID 1
    expect(tokenURI).to.equal(ipfsURI);

    // Assert the decrypted metadata matches the original metadata
    expect(decryptedMetadata).to.deep.equal(metadata);

    console.log("NFT minted, key verified, and metadata decrypted successfully.");
  });
});
