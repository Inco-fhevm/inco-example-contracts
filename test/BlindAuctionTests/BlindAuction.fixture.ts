import { ethers } from "hardhat";

import type { BlindAuction, ConfidentialERC20 } from "../../types";
import { getSigners } from "../signers";

export async function deployBlindAuctionFixture(): Promise<[ConfidentialERC20, BlindAuction]> {
  const signers = await getSigners();

  const ConfidentialERC20ContractFactory = await ethers.getContractFactory("ConfidentialERC20");
  const ConfidentialERC20Contract = await ConfidentialERC20ContractFactory.connect(signers.alice).deploy();
  await ConfidentialERC20Contract.waitForDeployment();

  const BlindAuctionContractFactory = await ethers.getContractFactory("BlindAuction");
  const BlindAuctionContract = await BlindAuctionContractFactory.connect(signers.alice).deploy(
    signers.alice.address,
    ConfidentialERC20Contract,
    3600,
    true,
  );
  await BlindAuctionContract.waitForDeployment();
  return [ConfidentialERC20Contract, BlindAuctionContract];
}
