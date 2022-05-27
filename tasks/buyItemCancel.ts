import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import config from '../config.json'

task("buy")
    .addParam("itemId", "itemId")
    .addParam("price", "price in ZCoins")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        const zcoin = (await hre.ethers.getContractAt("Zcoin", config.zcoinAddress))

        await zcoin.approve(config.auctionAddress, hre.ethers.utils.parseEther(args.price))
        await auction.buyItem(args.itemId)
    });

task("cancel")
    .addParam("itemId", "itemId")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        await auction.cancel(args.itemId)
    });
