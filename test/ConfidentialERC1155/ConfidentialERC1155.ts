import { expect } from "chai";
import { AbiCoder, AddressLike, Signature } from "ethers";

import { asyncDecrypt, awaitAllDecryptionResults } from "../asyncDecrypt";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployConfidentialERC1155 } from "./ConfidentialERC1155.fixture";

const hre = require("hardhat");

describe("ConfidentialERC1155Example Tests", function () {
  before(async function () {
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    this.instances = await createInstances(this.signers);
    this.ConfidentialERC1155 = await deployConfidentialERC1155();
    this.contractAddress = await this.ConfidentialERC1155.getAddress();
  });

  it("Should be able to form player", async function () {
    const inputAlice = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    inputAlice.add64(10);
    inputAlice.add64(100);
    inputAlice.add64(10000);
    const encryptedValue = inputAlice.encrypt();

    const formPlayerTx = await this.ConfidentialERC1155.formPlayer(
      100,
      200,
      [encryptedValue.handles[0],
      encryptedValue.handles[1],
      encryptedValue.handles[2]],
      encryptedValue.inputProof,
      { gasLimit: 5000000 },
    );
    await formPlayerTx.wait();

    //Verify alice's balance is correct after trasnfer From
    const balanceHandleForAliceSword = await this.ConfidentialERC1155.balanceOf(this.signers.alice.address, 100);
    const { publicKey: publicKeyAlice, privateKey: privateKeyAlice } = this.instances.alice.generateKeypair();
    const eip712ForAlice = this.instances.alice.createEIP712(publicKeyAlice, this.contractAddress);
    const signatureAlice = await this.signers.alice.signTypedData(
      eip712ForAlice.domain,
      { Reencrypt: eip712ForAlice.types.Reencrypt },
      eip712ForAlice.message,
    );
    // Alice reading Alice's balance
    const aliceBalanceForSword = await this.instances.alice.reencrypt(
      balanceHandleForAliceSword,
      privateKeyAlice,
      publicKeyAlice,
      signatureAlice.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address,
    );

    expect(aliceBalanceForSword).to.equal(10);
    console.log("The attack factor for alice sword is : ", aliceBalanceForSword);

    const balanceHandleForAlicePotion = await this.ConfidentialERC1155.balanceOf(this.signers.alice.address, 200);
    const aliceBalanceForPotion = await this.instances.alice.reencrypt(
      balanceHandleForAlicePotion,
      privateKeyAlice,
      publicKeyAlice,
      signatureAlice.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address,
    );

    expect(aliceBalanceForPotion).to.equal(100);
    console.log("The potion healing power for alice potion is : ", aliceBalanceForPotion);

    const balanceHandleForAliceCoins = await this.ConfidentialERC1155.balanceOf(this.signers.alice.address, 1);
    const aliceBalanceForCoins = await this.instances.alice.reencrypt(
      balanceHandleForAliceCoins,
      privateKeyAlice,
      publicKeyAlice,
      signatureAlice.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address,
    );

    expect(aliceBalanceForCoins).to.equal(10000);
    console.log("The balance of gold coins for Alice is : ", aliceBalanceForCoins);
  });

});
