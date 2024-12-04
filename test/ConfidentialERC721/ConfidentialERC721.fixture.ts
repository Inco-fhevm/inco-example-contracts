import { ethers } from "hardhat";

import type { PokemonCardPacks } from "../../types";
import { getSigners } from "../signers";


export async function deployConfidentialERC721(): Promise<PokemonCardPacks> {
  const signers = await getSigners();

  const erc721ContractFactory = await ethers.getContractFactory("PokemonCardPacks");
  const erc721Contract = await erc721ContractFactory.connect(signers.alice).deploy();

  return erc721Contract;
}
