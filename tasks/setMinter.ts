import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import config from '../config.json'

task("setMinter721")
    .setAction(async (args, hre) => {
        const zerc721Token = (await hre.ethers.getContractAt("Zerc721Token", config.erc721Address))
        await zerc721Token.setMinter(config.auctionAddress);
    });

task("setMinter1155")
    .setAction(async (args, hre) => {
        const zerc1155Token = (await hre.ethers.getContractAt("Zerc1155Token", config.erc1155Address))
        await zerc1155Token.setMinter(config.auctionAddress);
    });