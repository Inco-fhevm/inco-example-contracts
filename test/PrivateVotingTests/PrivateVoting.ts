import { expect } from "chai";
import { ethers } from "hardhat";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployVotingFixture } from "./PrivateVoting.fixture";

describe("Voting Contract Tests", function () {
  before(async function () {
    await initSigners();
    this.signers = await getSigners();
    this.instances = await createInstances(this.signers);
  });

  beforeEach(async function () {
    this.votingContract = await deployVotingFixture();
    this.contractAddress = await this.votingContract.getAddress();
  });

  describe("Should be able to vote and re-encrypt the values", function () {
    it("should be able to vote in favour and re-encrypt the values ", async function () {
      const input = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
      input.add64(1000);
      input.add8(1);
      const encryptedVotingCountAndEncryptedChoice = input.encrypt();

      const castVoteTx = await this.votingContract.castEncryptedVote(
        encryptedVotingCountAndEncryptedChoice.handles[0],
        encryptedVotingCountAndEncryptedChoice.handles[1],
        encryptedVotingCountAndEncryptedChoice.inputProof,
      );

      await castVoteTx.wait();

      const eboolVoteChoice = await this.votingContract.getOwnEncryptedVoteChoice();
      const euint64VotePower = await this.votingContract.getOwnEncryptedVoteCount();
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
      const voteChoice = await this.instances.alice.reencrypt(
        eboolVoteChoice,
        alicePrivateKey,
        alicePublicKey,
        aliceSignature.replace("0x", ""),
        this.contractAddress,
        this.signers.alice.address,
      );

      const votePower = await this.instances.alice.reencrypt(
        euint64VotePower,
        alicePrivateKey,
        alicePublicKey,
        aliceSignature.replace("0x", ""),
        this.contractAddress,
        this.signers.alice.address,
      );

      console.log("user voted for : ", voteChoice);
      console.log("user vote power is : ", votePower);
    });
  });

  // describe("Should be able to vote ", function () {
  //   it("should be able to vote in favour ", async function () {
  //     const input = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
  //     input.add64(1000);
  //     input.add8(1);
  //     const encryptedVotingCountAndEncryptedChoice = input.encrypt();

  //     const castVoteTx = await this.votingContract.castEncryptedVote(
  //       encryptedVotingCountAndEncryptedChoice.handles[0],
  //       encryptedVotingCountAndEncryptedChoice.handles[1],
  //       encryptedVotingCountAndEncryptedChoice.inputProof,
  //     );

  //     await castVoteTx.wait();
  //   });

  //   it("should be able to vote against the proposal ", async function () {
  //     const input = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
  //     input.add64(1000);
  //     input.add8(0);
  //     const encryptedVotingCountAndEncryptedChoice = input.encrypt();

  //     const castVoteTx = await this.votingContract.castEncryptedVote(
  //       encryptedVotingCountAndEncryptedChoice.handles[0],
  //       encryptedVotingCountAndEncryptedChoice.handles[1],
  //       encryptedVotingCountAndEncryptedChoice.inputProof,
  //     );

  //     await castVoteTx.wait();
  //   });
  // });

});
