import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import { Contract, ContractReceipt } from "ethers";

import config from '../config.json'

const getEventData = (
    eventName: string,
    contract: Contract,
    txResult: ContractReceipt
  ): any => {
    if (!Array.isArray(txResult.logs)) return null;
    for (let log of txResult.logs) {
      try {
        const decoded = contract.interface.parseLog(log);
        if (decoded.name === eventName)
          return {
            ...decoded,
            ...decoded.args
          };
      } catch (error) { }
    }
    return null;
  };

task("listItem721")
    .addParam("tokenId", "tokenId")
    .addParam("price", "price in ZCoins")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        const zerc721Token = (await hre.ethers.getContractAt("Zerc721Token", config.erc721Address))
    
        await zerc721Token.approve(auction.address, args.tokenId);
        let receipt = await (await auction['listItem(uint256,uint256)'](args.tokenId, hre.ethers.utils.parseEther(args.price))).wait(1);
        let itemId = getEventData("ItemOnSale", auction, receipt).itemId;
        console.log("itemId " + itemId)
    });

task("listItem1155")
    .addParam("id", "id of tokens")
    .addParam("amount", "amount")
    .addParam("price", "price in ZCoins")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        const zerc1155Token = (await hre.ethers.getContractAt("Zerc1155Token", config.erc1155Address))

        await zerc1155Token.setApprovalForAll(auction.address, true)
        let receipt = await (await auction["listItem(uint256,uint256,uint256)"](args.id, args.amount, hre.ethers.utils.parseEther(args.price))).wait(1);
        let itemId = getEventData("ItemOnSale", auction, receipt).itemId;
        console.log("itemId " + itemId)
        await zerc1155Token.setApprovalForAll(auction.address, false)
    });