import { ethers } from "hardhat";

import type { ConfidentialGameProfiles } from "../../types";
import { getSigners } from "../signers";


export async function deployConfidentialERC1155(): Promise<ConfidentialGameProfiles> {
  const signers = await getSigners();

  const erc1155ContractFactory = await ethers.getContractFactory("ConfidentialGameProfiles");
  const erc1155Contract = await erc1155ContractFactory.connect(signers.alice).deploy();
  console.log(await erc1155Contract.getAddress());
  return erc1155Contract;
}
