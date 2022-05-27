import { ethers } from "hardhat";

import config from '../config.json'

async function main() {
  const Zerc1155Token = await ethers.getContractFactory("Zerc1155Token");
  const z = await Zerc1155Token.deploy(
    "SUPER ERC 1155 NFT", 
    "ZERC1155", 
    config.BASE_TOKEN_URI_1155
    );

  await z.deployed();

  console.log("Zerc1155Token deployed to: ", z.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
