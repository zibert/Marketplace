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

task("mint721")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        const zerc721Token = (await hre.ethers.getContractAt("Zerc721Token", config.erc721Address))
    
        let receipt = await (await auction['createItem()']()).wait(1);
        let tokenId = getEventData("Transfer", zerc721Token, receipt).tokenId;
        console.log("tokenId " + tokenId)
    });

task("mint1155")
    .addParam("id", "id of tokons")
    .addParam("amount", "amount")
    .setAction(async (args, hre) => {
        const auction = (await hre.ethers.getContractAt("Auction", config.auctionAddress))
        const zerc1155Token = (await hre.ethers.getContractAt("Zerc1155Token", config.erc1155Address))
    
        await auction["createItem(uint256,uint256)"](args.id, args.amount)
    });