import { ethers } from "hardhat";

import config from '../config.json'

async function main() {
  const Zerc721Token = await ethers.getContractFactory("Zerc721Token");
  const z = await Zerc721Token.deploy(
    "SUPER ERC 721 NFT", 
    "ZERC721", 
    config.BASE_TOKEN_URI_721
    );

  await z.deployed();

  console.log("Zerc721Token deployed to: ", z.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
