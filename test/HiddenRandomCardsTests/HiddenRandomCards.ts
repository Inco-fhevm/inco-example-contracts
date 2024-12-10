import { expect } from "chai";
import { awaitAllDecryptionResults } from "../asyncDecrypt";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployRandomNumberGeneratorFixture } from "./HiddenRandomCards.fixture";

describe("Random Number Generator Tests", function () {
  before(async function () {
    // Initialize signers before running tests
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    // Deploy the Random Number Generator contract before each test
    const rngContract = await deployRandomNumberGeneratorFixture();
    this.contractAddress = await rngContract.getAddress();
    this.rngContract = rngContract;
    this.instances = await createInstances(this.signers);
  });

  it("Should generate random numbers, re-encrypt, and retrieve them", async function () {
    // Generate random numbers
    const transaction = await this.rngContract.generateRandomNumber({ gasLimit: 5000000 });
    await transaction.wait();

    // Retrieve encrypted random numbers from the contract
    const [encRandomNum1, encRandomNum2, encRandomNum3] = await this.rngContract.viewEncryptedRandomNumber();

    // Generate public-private keypair for Alice
    const { publicKey: alicePublicKey, privateKey: alicePrivateKey } = this.instances.alice.generateKeypair();

    // Prepare EIP-712 signature for Alice's re-encryption request
    const eip712Message = this.instances.alice.createEIP712(alicePublicKey, this.contractAddress);
    const aliceSignature = await this.signers.alice.signTypedData(
      eip712Message.domain,
      { Reencrypt: eip712Message.types.Reencrypt },
      eip712Message.message,
    );

    // Re-encrypt each random number and retrieve results
    const firstRandomNumber = await this.instances.alice.reencrypt(
      encRandomNum1,
      alicePrivateKey,
      alicePublicKey,
      aliceSignature.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address,
    );

    const secondRandomNumber = await this.instances.alice.reencrypt(
      encRandomNum2,
      alicePrivateKey,
      alicePublicKey,
      aliceSignature.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address,
    );

    const thirdRandomNumber = await this.instances.alice.reencrypt(
      encRandomNum3,
      alicePrivateKey,
      alicePublicKey,
      aliceSignature.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address,
    );

    // Output the re-encrypted random numbers
    console.log("First Random Number:", Number(firstRandomNumber)%53);
    console.log("Second Random Number:", Number(secondRandomNumber)%53);
    console.log("Third Random Number:", Number(thirdRandomNumber)%53);
  });

});
