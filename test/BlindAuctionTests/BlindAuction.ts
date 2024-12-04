import { expect } from "chai";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployBlindAuctionFixture } from "./BlindAuction.fixture";

describe("Blind Auction Tests", function () {
  before(async function () {
    // Initialize signers before running tests
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    // Deploy the Random Number Generator contract before each test
    const [ConfidentialERC20Contract, BlindAuctionContract] = await deployBlindAuctionFixture();
    this.contractAddress = await BlindAuctionContract.getAddress();
    this.auction = BlindAuctionContract;
    this.tokenContract = ConfidentialERC20Contract;
    this.instances = await createInstances(this.signers);
  });


  it("should allow a user to place a bid and update the highest bid", async function () {
    const bidAmount = 1000;

    // Mint tokens for Alice
    const mintTx = await this.tokenContract.mint(bidAmount);
    await mintTx.wait();

    // Encrypt the bid amount
    const input = this.instances.alice.createEncryptedInput(this.contractAddress, this.signers.alice.address);
    input.add64(bidAmount);
    const encryptedBid = input.encrypt();

    const approveTx = await this.tokenContract['approve(address,bytes32,bytes)'](await this.auction.getAddress(), encryptedBid.handles[0],encryptedBid.inputProof);
    await approveTx.wait();

    // Alice places a bid
    const bidTx = await this.auction
      .connect(this.signers.alice)
      .bid(encryptedBid.handles[0], encryptedBid.inputProof,{gasLimit:7000000});
    await bidTx.wait();

    // Validate that the bid was recorded
    const bidHandle = await this.auction.getBid(this.signers.alice.address);
    const { publicKey, privateKey } = this.instances.alice.generateKeypair();
    const eip712 = this.instances.alice.createEIP712(publicKey, this.contractAddress);
    const signature = await this.signers.alice.signTypedData(
      eip712.domain,
      { Reencrypt: eip712.types.Reencrypt },
      eip712.message
    );

    const actualBid = await this.instances.alice.reencrypt(
      bidHandle,
      privateKey,
      publicKey,
      signature.replace("0x", ""),
      this.contractAddress,
      this.signers.alice.address
    );
    expect(actualBid).to.equal(bidAmount);
  });

  it("should allow the owner to stop the auction manually", async function () {
    // Stop the auction
    const stopTx = await this.auction.stop();
    await stopTx.wait();

    // Verify that the auction is stopped
    const isManuallyStopped = await this.auction.manuallyStopped();
    expect(expect(isManuallyStopped).to.be.true);
  });

})
