import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import config from '../config.json'

task("addZcoins")
    .addParam("toAccount", "toAccount")
    .addParam("amount", "amount")
    .setAction(async (args, hre) => {
        const zcoin = (await hre.ethers.getContractFactory("Zcoin"))
            .attach(config.zcoinAddress);
        await zcoin.mint(args.toAccount, hre.ethers.utils.parseEther(args.amount));
        const balance = await zcoin.balanceOf(args.toAccount);
        console.log(
            `balance are ${balance.toString()} zcoins for address ${args.toAccount}`
        );
    });