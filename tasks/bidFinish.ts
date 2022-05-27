import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import config from '../config.json'

task("bid")
    .addParam("lotId", "lotId")
    .addParam("price", "price in ZCoins")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        const zcoin = (await hre.ethers.getContractAt("Zcoin", config.zcoinAddress))

        await zcoin.approve(config.auctionAddress, hre.ethers.utils.parseEther(args.price))
        await auction.makeBid(args.lotId, hre.ethers.utils.parseEther(args.price))
    });

task("finish")
    .addParam("lotId", "lotId")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        await auction.finishAuction(args.lotId)
    });
