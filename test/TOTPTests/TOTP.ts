import { expect } from "chai";

import { awaitAllDecryptionResults } from "../asyncDecrypt";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployTOTPFixture } from "./TOTP.fixture";

describe("Random Number Generator Tests", function () {
  before(async function () {
    // Initialize signers before running tests
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    // Deploy the Random Number Generator contract before each test
    const contract = await deployTOTPFixture();
    this.contractAddress = await contract.getAddress();
    this.totp = contract;
    this.instances = await createInstances(this.signers);
  });

  describe("TOTP Setup", function () {
    it("Should be able to validate the OTP", async function () {
      const inputForSecretKey = this.instances.alice.createEncryptedInput(
        this.contractAddress,
        this.signers.alice.address,
      );
      inputForSecretKey.add16(1000); // Ensure 'totp' is a BigInt for add32
      const encryptedSecretKey = inputForSecretKey.encrypt();
      const setTotpSecretKey = await this.totp.setSecretKey(
        encryptedSecretKey.handles[0],
        encryptedSecretKey.inputProof,
      );
      await setTotpSecretKey.wait();
      // Get the TOTP secret key first
      const secretKeyHandle = await this.totp.viewSecretKey();
      const { publicKey: publicKeyAlice, privateKey: privateKeyAlice } = this.instances.alice.generateKeypair();
      const eip712 = this.instances.alice.createEIP712(publicKeyAlice, this.contractAddress);
      const signatureAlice = await this.signers.alice.signTypedData(
        eip712.domain,
        { Reencrypt: eip712.types.Reencrypt },
        eip712.message,
      );
      const secretKey = await this.instances.alice.reencrypt(
        secretKeyHandle,
        privateKeyAlice,
        publicKeyAlice,
        signatureAlice.replace("0x", ""),
        this.contractAddress,
        this.signers.alice.address,
      );

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const last5TimeStamp = currentTimestamp % 100000;

      // Ensure secretKey is of type number for multiplication
      const totp = last5TimeStamp * Number(secretKey);
      console.log(totp);

      // Now we have access to the TOTP value, use Bob to validate the TOTP
      const input = this.instances.bob.createEncryptedInput(this.contractAddress, this.signers.bob.address);
      input.add32(BigInt(totp)); // Ensure 'totp' is a BigInt for add32
      const encryptedTotp = input.encrypt();

      const validateTx = await this.totp
        .connect(this.signers.bob)
        .validateTOTP(encryptedTotp.handles[0], encryptedTotp.inputProof, currentTimestamp);

      await validateTx.wait();

      const resultHandle = await this.totp.getIsTotpValid(this.signers.bob.address);

      const { publicKey: publicKeyBob, privateKey: privateKeyBob } = this.instances.bob.generateKeypair();
      const eip712ForBob = this.instances.bob.createEIP712(publicKeyBob, this.contractAddress);
      const signatureBob = await this.signers.bob.signTypedData(
        eip712ForBob.domain,
        { Reencrypt: eip712ForBob.types.Reencrypt },
        eip712ForBob.message,
      );

      const actualValue = await this.instances.bob.reencrypt(
        resultHandle,
        privateKeyBob,
        publicKeyBob,
        signatureBob.replace("0x", ""),
        this.contractAddress,
        this.signers.bob.address,
      );

      console.log("The actual value is:", actualValue);
    });
  });
});
