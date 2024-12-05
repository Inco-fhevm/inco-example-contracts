import { expect } from "chai";

import { awaitAllDecryptionResults } from "../asyncDecrypt";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployConfidentialDIDFixture } from "./ConfidentialDID.fixture";

describe("ConfidentialDID Tests", function () {
  before(async function () {
    // Initialize signers before running tests
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    // Deploy the ConfidentialDID contract before each test
    const didContract = await deployConfidentialDIDFixture();
    this.contractAddress = await didContract.getAddress();
    this.didContract = didContract;
    this.instances = await createInstances(this.signers);
  });

  it("should store Bob's credit score and check eligibility", async function () {
    const creditScore = 600; // Example credit score above 700

    // Step 1: Encrypt the credit score using Alice (trusted agent)
    const input = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    input.add64(creditScore); // Add credit score
    const encryptedCreditScore = input.encrypt();

    // Step 2: Alice stores the credit score for Bob
    const storeTx = await this.didContract
      .connect(this.signers.alice)
      .store(this.signers.bob.address, encryptedCreditScore.handles[0], encryptedCreditScore.inputProof);
    await storeTx.wait();

    // Step 3: Bob reencrypts to view his credit score
    const creditScoreHandle = await this.didContract.viewOwnScore(this.signers.bob.address);
    const { publicKey: publicKeyBob, privateKey: privateKeyBob } = this.instances.bob.generateKeypair();
    const eip712ForBob = this.instances.bob.createEIP712(publicKeyBob, this.contractAddress);
    const signatureBob = await this.signers.bob.signTypedData(
      eip712ForBob.domain,
      { Reencrypt: eip712ForBob.types.Reencrypt },
      eip712ForBob.message
    );

    const decryptedCreditScore = await this.instances.bob.reencrypt(
      creditScoreHandle,
      privateKeyBob,
      publicKeyBob,
      signatureBob.replace("0x", ""),
      this.contractAddress,
      this.signers.bob.address
    );

    // Assert that Bob's decrypted credit score is correct
    expect(decryptedCreditScore).to.equal(creditScore);

    // Step 4: Verify eligibility without knowing the actual score
    const isEligibleHandle = await this.didContract.isUserScoreAbove750(this.signers.bob.address);
    const decryptedEligibility = await this.instances.bob.reencrypt(
      isEligibleHandle,
      privateKeyBob,
      publicKeyBob,
      signatureBob.replace("0x", ""),
      this.contractAddress,
      this.signers.bob.address
    );

    // Assert that Bob is eligible
    expect(decryptedEligibility).to.equal(0); // True because 750 > 700
  });

  it("should store Bob's credit score below threshold and check ineligibility", async function () {
    const creditScore = 650; // Example credit score below 700

    // Step 1: Encrypt the credit score using Alice (trusted agent)
    const input = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    input.add64(creditScore); // Add credit score
    const encryptedCreditScore = input.encrypt();

    // Step 2: Alice stores the credit score for Bob
    const storeTx = await this.didContract
      .connect(this.signers.alice)
      .store(this.signers.bob.address, encryptedCreditScore.handles[0], encryptedCreditScore.inputProof);
    await storeTx.wait();

    // Step 3: Bob reencrypts to view his credit score
    const creditScoreHandle = await this.didContract.viewOwnScore(this.signers.bob.address);
    const { publicKey: publicKeyBob, privateKey: privateKeyBob } = this.instances.bob.generateKeypair();
    const eip712ForBob = this.instances.bob.createEIP712(publicKeyBob, this.contractAddress);
    const signatureBob = await this.signers.bob.signTypedData(
      eip712ForBob.domain,
      { Reencrypt: eip712ForBob.types.Reencrypt },
      eip712ForBob.message
    );

    const decryptedCreditScore = await this.instances.bob.reencrypt(
      creditScoreHandle,
      privateKeyBob,
      publicKeyBob,
      signatureBob.replace("0x", ""),
      this.contractAddress,
      this.signers.bob.address
    );

    // Assert that Bob's decrypted credit score is correct
    expect(decryptedCreditScore).to.equal(creditScore);

    // Step 4: Verify ineligibility without knowing the actual score
    const isEligibleHandle = await this.didContract.isUserScoreAbove750(this.signers.bob.address);
    const decryptedEligibility = await this.instances.bob.reencrypt(
      isEligibleHandle,
      privateKeyBob,
      publicKeyBob,
      signatureBob.replace("0x", ""),
      this.contractAddress,
      this.signers.bob.address
    );

    // Assert that Bob is not eligible
    expect(decryptedEligibility).to.equal(0); // False because 650 < 700
  });
});
