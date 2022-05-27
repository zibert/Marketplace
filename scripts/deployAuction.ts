import { ethers } from "hardhat";

import config from '../config.json'

async function main() {
  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy(
    config.zcoinAddress, 
    config.erc721Address, 
    config.erc1155Address
    );

  await auction.deployed();

  console.log("Auction deployed to: ", auction.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
