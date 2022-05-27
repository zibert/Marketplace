import { ethers, waffle, network } from 'hardhat'
import chai from 'chai'

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address"

import ZcoinArtifacts from '../artifacts/contracts/Zcoin.sol/Zcoin.json'
import { Zcoin } from '../src/types/Zcoin'

import Zerc721TokenArtifacts from '../artifacts/contracts/Zerc721Token.sol/Zerc721Token.json'
import { Zerc721Token } from '../src/types/Zerc721Token'

import Zerc1155TokenArtifacts from '../artifacts/contracts/Zerc1155Token.sol/Zerc1155Token.json'
import { Zerc1155Token } from '../src/types/Zerc1155Token'

import AuctionArtifacts from '../artifacts/contracts/Auction.sol/Auction.json'
import { Auction } from '../src/types/Auction'

const { deployContract } = waffle
const { expect } = chai

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

describe('Auction Test', () => {
  const BASE_TOKEN_URI_721 = config.BASE_TOKEN_URI_721;
  const BASE_TOKEN_URI_1155 = config.BASE_TOKEN_URI_1155;
  let zerc721Token: Zerc721Token;
  let zerc1155Token: Zerc1155Token;
  let zcoin: Zcoin;
  let auction: Auction;
  let signers: SignerWithAddress[]
  let owner: SignerWithAddress;
  let acc1: SignerWithAddress;
  let acc2: SignerWithAddress;
  let acc3: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    let network = await ethers.provider.getNetwork();

    owner = signers[0];
    acc1 = signers[1];
    acc2 = signers[2];
    acc3 = signers[3];
    seller = signers[4];
    buyer = signers[5];
    bidder1 = signers[6];
    bidder2 = signers[7];

    zcoin = (await deployContract(owner, ZcoinArtifacts)) as Zcoin;

    zerc721Token = (await deployContract(owner, Zerc721TokenArtifacts,
      ["SUPER ERC 721 NFT", "ZERC721", BASE_TOKEN_URI_721]
    )) as Zerc721Token;

    zerc1155Token = (await deployContract(owner, Zerc1155TokenArtifacts,
      ["SUPER ERC 1155 NFT", "ZERC1155", BASE_TOKEN_URI_1155]
    )) as Zerc1155Token;

    auction = (await deployContract(owner, AuctionArtifacts,
      [zcoin.address, zerc721Token.address, zerc1155Token.address]
    )) as Auction;

    await zerc721Token.setMinter(auction.address);
    await zerc1155Token.setMinter(auction.address);
  })

  it('erc721 is correct', async () => {
    expect((await zerc721Token.name())).to.eq("SUPER ERC 721 NFT");
    expect((await zerc721Token.symbol())).to.eq("ZERC721");

    await expect(zerc721Token.connect(acc1).mintTo(acc2.address)).to.be.revertedWith(
      "not minter"
    );

    expect((await zerc721Token.totalSupply())).to.eq(0);
    await zerc721Token.setMinter(owner.address);
    await zerc721Token.mintTo(owner.address);
    expect((await zerc721Token.tokenURI(1))).to.eq(BASE_TOKEN_URI_721 + 1);

    await expect(zerc721Token.connect(buyer).setMinter(acc1.address)).to.be.revertedWith(
      "not owner"
    );
  })

  it('erc1155 is correct', async () => {
    expect((await zerc1155Token.name())).to.eq("SUPER ERC 1155 NFT");
    expect((await zerc1155Token.symbol())).to.eq("ZERC1155");

    await expect(zerc1155Token.connect(acc1).mintTo(acc2.address, 1, 1)).to.be.revertedWith(
      "not minter"
    );

    expect((await zerc1155Token.totalSupply(1))).to.eq(0);

    await expect(zerc1155Token.connect(buyer).setMinter(acc1.address)).to.be.revertedWith(
      "not owner"
    );
  })

  it('createItem is correct', async () => {
    let receipt = await (await auction['createItem()']()).wait(1);
    let tokenId = getEventData("Transfer", zerc721Token, receipt).tokenId;

    expect(tokenId).to.eq(1);

    expect(await zerc721Token.balanceOf(owner.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);

    await zerc721Token.approve(auction.address, tokenId);
    await zerc721Token['safeTransferFrom(address,address,uint256)'](owner.address, auction.address, tokenId);

    expect(await zerc721Token.balanceOf(owner.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(1);

    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);

    await auction['createItem(uint256,uint256)'](2, 42);

    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    await zerc1155Token.setApprovalForAll(auction.address, true);

    await zerc1155Token['safeTransferFrom(address,address,uint256,uint256)'](owner.address, auction.address, 2, 42);

    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(42);

  })

  it('buy erc721 is correct', async () => {

    await zcoin.mint(buyer.address, ethers.utils.parseEther("100.0"));
    let receipt = await (await auction.connect(seller)['createItem()']()).wait(1);
    let tokenId = getEventData("Transfer", zerc721Token, receipt).tokenId;
    expect(await zcoin.balanceOf(buyer.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(seller.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(buyer.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(seller.address)).to.eq(1);

    await zerc721Token.connect(seller).approve(auction.address, tokenId);
    receipt = await (await auction.connect(seller)['listItem(uint256,uint256)'](tokenId, ethers.utils.parseEther("40.0"))).wait(1);
    let itemId = getEventData("ItemOnSale", auction, receipt).itemId;

    let itemInfo = await auction.getItem(itemId);
    expect(itemInfo.tokenId).to.eq(tokenId);
    expect(itemInfo.price).to.eq(ethers.utils.parseEther("40.0"));
    expect(itemInfo.owner).to.eq(seller.address);

    expect(await zcoin.balanceOf(buyer.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(seller.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(buyer.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(seller.address)).to.eq(0);

    await zcoin.connect(buyer).approve(auction.address, ethers.utils.parseEther("50.0"));
    await auction.connect(buyer).buyItem(itemId);

    expect(await zcoin.balanceOf(buyer.address)).to.eq(ethers.utils.parseEther("60.0"));
    expect(await zcoin.balanceOf(seller.address)).to.eq(ethers.utils.parseEther("40.0"));
    expect(await zerc721Token.balanceOf(buyer.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(seller.address)).to.eq(0);

    await expect(auction.connect(buyer).buyItem(itemId)).to.be.revertedWith(
      "trade position is not active"
    );

  })

  it('buy erc1155 is correct', async () => {

    await zcoin.mint(buyer.address, ethers.utils.parseEther("100.0"));
    await auction.connect(seller)['createItem(uint256,uint256)'](2, 42)
    expect(await zcoin.balanceOf(buyer.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(seller.address)).to.eq(0);
    expect(await zerc1155Token.balanceOf(buyer.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(seller.address, 2)).to.eq(42);


    await zerc1155Token.connect(seller).setApprovalForAll(auction.address, true);

    let receipt = await (await auction.connect(seller)['listItem(uint256,uint256,uint256)'](2, 42, ethers.utils.parseEther("40.0"))).wait(1);
    let itemId = getEventData("ItemOnSale", auction, receipt).itemId;

    expect(await zcoin.balanceOf(buyer.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(seller.address)).to.eq(0);
    expect(await zerc1155Token.balanceOf(buyer.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(seller.address, 2)).to.eq(0);

    await zcoin.connect(buyer).approve(auction.address, ethers.utils.parseEther("50.0"));
    await auction.connect(buyer).buyItem(itemId);

    expect(await zcoin.balanceOf(buyer.address)).to.eq(ethers.utils.parseEther("60.0"));
    expect(await zcoin.balanceOf(seller.address)).to.eq(ethers.utils.parseEther("40.0"));
    expect(await zerc1155Token.balanceOf(buyer.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(seller.address, 2)).to.eq(0);

    await expect(auction.connect(buyer).buyItem(itemId)).to.be.revertedWith(
      "trade position is not active"
    );

  })

  it('cancel erc721 is correct', async () => {
    let receipt = await (await auction.connect(seller)['createItem()']()).wait(1);
    let tokenId = getEventData("Transfer", zerc721Token, receipt).tokenId;
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(seller.address)).to.eq(1);

    await zerc721Token.connect(seller).approve(auction.address, tokenId);
    receipt = await (await auction.connect(seller)['listItem(uint256,uint256)'](tokenId, ethers.utils.parseEther("40.0"))).wait(1);
    let itemId = getEventData("ItemOnSale", auction, receipt).itemId;

    expect(await zerc721Token.balanceOf(auction.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(seller.address)).to.eq(0);

    await expect(auction.connect(buyer).cancel(itemId)).to.be.revertedWith(
      "not owner"
    );
    await auction.connect(seller).cancel(itemId)

    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(seller.address)).to.eq(1);

    await expect(auction.connect(seller).cancel(itemId)).to.be.revertedWith(
      "trade position is not active"
    );

  })

  it('cancel erc1155 is correct', async () => {

    await auction.connect(seller)['createItem(uint256,uint256)'](2, 42)
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(seller.address, 2)).to.eq(42);

    await zerc1155Token.connect(seller).setApprovalForAll(auction.address, true);

    let receipt = await (await auction.connect(seller)['listItem(uint256,uint256,uint256)'](2, 42, ethers.utils.parseEther("40.0"))).wait(1);
    let itemId = getEventData("ItemOnSale", auction, receipt).itemId;

    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(seller.address, 2)).to.eq(0);

    await expect(auction.connect(buyer).cancel(itemId)).to.be.revertedWith(
      "not owner"
    );
    await auction.connect(seller).cancel(itemId)

    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(seller.address, 2)).to.eq(42);

    await expect(auction.connect(seller).cancel(itemId)).to.be.revertedWith(
      "trade position is not active"
    );
  })

  it('auction erc1155 is correct', async () => {

    await zcoin.mint(bidder1.address, ethers.utils.parseEther("100.0"));
    await zcoin.mint(bidder2.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder1).approve(auction.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder2).approve(auction.address, ethers.utils.parseEther("100.0"));

    let receipt = await (await auction['createItem(uint256,uint256)'](2, 42)).wait(1);
    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(0);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(42);

    await zerc1155Token.setApprovalForAll(auction.address, true);
    receipt = await (await auction['listItemOnAuction(uint256,uint256)'](2, 42)).wait(1);
    let lotId = getEventData("LotOnAuction", auction, receipt).lotId;

    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(0);

    await expect(auction.connect(bidder1).makeBid(lotId, 0)).to.be.revertedWith(
      "bid is less than current"
    );

    await auction.connect(bidder1).makeBid(lotId, ethers.utils.parseEther("1.0"));

    let lotInfo = await auction.getLot(lotId);

    expect(lotInfo.lastBidAddress).to.eq(bidder1.address);
    expect(lotInfo.lastBidAmount).to.eq(ethers.utils.parseEther("1.0"));
    expect(lotInfo.bidsCount).to.eq(1);

    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("99.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(ethers.utils.parseEther("1.0"));

    await expect(auction.connect(bidder2).makeBid(lotId, ethers.utils.parseEther("0.5"))).to.be.revertedWith(
      "bid is less than current"
    );

    await auction.connect(bidder2).makeBid(lotId, ethers.utils.parseEther("2.0"));

    lotInfo = await auction.getLot(lotId);

    expect(lotInfo.lastBidAddress).to.eq(bidder2.address);
    expect(lotInfo.lastBidAmount).to.eq(ethers.utils.parseEther("2.0"));
    expect(lotInfo.bidsCount).to.eq(2);

    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("98.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(ethers.utils.parseEther("2.0"));

    await expect(auction.connect(bidder2).finishAuction(lotId)).to.be.revertedWith(
      "auction is still in progress"
    );

    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1])
    await network.provider.send("evm_mine")

    await (auction.connect(bidder2).finishAuction(lotId));

    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(ethers.utils.parseEther("2.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("98.0"));

    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(bidder2.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(bidder1.address, 2)).to.eq(0);

    await expect(auction.connect(bidder2).finishAuction(lotId)).to.be.revertedWith(
      "auction is not active"
    );
  })

  it('auction erc721 is correct', async () => {

    await zcoin.mint(bidder1.address, ethers.utils.parseEther("100.0"));
    await zcoin.mint(bidder2.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder1).approve(auction.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder2).approve(auction.address, ethers.utils.parseEther("100.0"));

    let receipt = await (await auction['createItem()']()).wait(1);
    let tokenId = getEventData("Transfer", zerc721Token, receipt).tokenId;
    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(owner.address)).to.eq(1);

    await zerc721Token.approve(auction.address, tokenId);
    receipt = await (await auction['listItemOnAuction(uint256)'](tokenId)).wait(1);
    let lotId = getEventData("LotOnAuction", auction, receipt).lotId;

    expect(await zerc721Token.balanceOf(auction.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(owner.address)).to.eq(0);

    await expect(auction.connect(bidder1).makeBid(lotId, 0)).to.be.revertedWith(
      "bid is less than current"
    );

    await auction.connect(bidder1).makeBid(lotId, ethers.utils.parseEther("1.0"));

    let lotInfo = await auction.getLot(lotId);

    expect(lotInfo.lastBidAddress).to.eq(bidder1.address);
    expect(lotInfo.lastBidAmount).to.eq(ethers.utils.parseEther("1.0"));
    expect(lotInfo.bidsCount).to.eq(1);

    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("99.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(ethers.utils.parseEther("1.0"));

    await expect(auction.connect(bidder2).makeBid(lotId, ethers.utils.parseEther("0.5"))).to.be.revertedWith(
      "bid is less than current"
    );

    await auction.connect(bidder2).makeBid(lotId, ethers.utils.parseEther("2.0"));

    lotInfo = await auction.getLot(lotId);

    expect(lotInfo.lastBidAddress).to.eq(bidder2.address);
    expect(lotInfo.lastBidAmount).to.eq(ethers.utils.parseEther("2.0"));
    expect(lotInfo.bidsCount).to.eq(2);

    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("98.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(ethers.utils.parseEther("2.0"));

    await expect(auction.connect(bidder2).finishAuction(lotId)).to.be.revertedWith(
      "auction is still in progress"
    );

    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1])
    await network.provider.send("evm_mine")

    await (auction.connect(bidder2).finishAuction(lotId));

    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(ethers.utils.parseEther("2.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("98.0"));

    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(owner.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(bidder2.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(bidder1.address)).to.eq(0);

    await expect(auction.connect(bidder2).finishAuction(lotId)).to.be.revertedWith(
      "auction is not active"
    );
  })

  it('failed auction erc721 is correct', async () => {

    await zcoin.mint(bidder1.address, ethers.utils.parseEther("100.0"));
    await zcoin.mint(bidder2.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder1).approve(auction.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder2).approve(auction.address, ethers.utils.parseEther("100.0"));

    let receipt = await (await auction['createItem()']()).wait(1);
    let tokenId = getEventData("Transfer", zerc721Token, receipt).tokenId;
    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(owner.address)).to.eq(1);

    await zerc721Token.approve(auction.address, tokenId);
    receipt = await (await auction['listItemOnAuction(uint256)'](tokenId)).wait(1);
    let lotId = getEventData("LotOnAuction", auction, receipt).lotId;

    expect(await zerc721Token.balanceOf(auction.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(owner.address)).to.eq(0);

    await expect(auction.connect(bidder1).makeBid(lotId, 0)).to.be.revertedWith(
      "bid is less than current"
    );

    await auction.connect(bidder1).makeBid(lotId, ethers.utils.parseEther("1.0"));

    let lotInfo = await auction.getLot(lotId);

    expect(lotInfo.lastBidAddress).to.eq(bidder1.address);
    expect(lotInfo.lastBidAmount).to.eq(ethers.utils.parseEther("1.0"));
    expect(lotInfo.bidsCount).to.eq(1);

    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("99.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(ethers.utils.parseEther("1.0"));


    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1])
    await network.provider.send("evm_mine")

    await (auction.connect(bidder2).finishAuction(lotId));

    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(0);
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("100.0"));

    expect(await zerc721Token.balanceOf(auction.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(owner.address)).to.eq(1);
    expect(await zerc721Token.balanceOf(bidder2.address)).to.eq(0);
    expect(await zerc721Token.balanceOf(bidder1.address)).to.eq(0);

    await expect(auction.connect(bidder2).finishAuction(lotId)).to.be.revertedWith(
      "auction is not active"
    );
  })

  it('failed auction erc1155 is correct', async () => {

    await zcoin.mint(bidder1.address, ethers.utils.parseEther("100.0"));
    await zcoin.mint(bidder2.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder1).approve(auction.address, ethers.utils.parseEther("100.0"));
    await zcoin.connect(bidder2).approve(auction.address, ethers.utils.parseEther("100.0"));

    let receipt = await (await auction['createItem(uint256,uint256)'](2, 42)).wait(1);
    expect(await zcoin.balanceOf(bidder1.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("100.0"));
    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(0);
    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(42);

    await zerc1155Token.setApprovalForAll(auction.address, true);
    receipt = await (await auction['listItemOnAuction(uint256,uint256)'](2, 42)).wait(1);
    let lotId = getEventData("LotOnAuction", auction, receipt).lotId;

    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(0);

    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60 + 1])
    await network.provider.send("evm_mine")

    await (auction.connect(bidder2).finishAuction(lotId));

    expect(await zcoin.balanceOf(auction.address)).to.eq(0);
    expect(await zcoin.balanceOf(owner.address)).to.eq(0);
    expect(await zcoin.balanceOf(bidder2.address)).to.eq(ethers.utils.parseEther("100.0"));

    expect(await zerc1155Token.balanceOf(auction.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(owner.address, 2)).to.eq(42);
    expect(await zerc1155Token.balanceOf(bidder2.address, 2)).to.eq(0);
    expect(await zerc1155Token.balanceOf(bidder1.address, 2)).to.eq(0);

    await expect(auction.connect(bidder2).finishAuction(lotId)).to.be.revertedWith(
      "auction is not active"
    );
  })

  it('service test', async () => {
      await zerc1155Token.setMinter(owner.address);
      await zerc1155Token.mintTo(owner.address, 2, 42);
      await zerc1155Token.mintTo(owner.address, 3, 42);
      await zerc1155Token["safeBatchTransferFrom(address,address,uint256[],uint256[])"](owner.address, auction.address,[2,3],[42,42]);

      expect(await auction.supportsInterface("0x4e2312e0")).to.eq(true);
      expect(await auction.supportsInterface("0x150b7a02")).to.eq(true);
      expect(await auction.supportsInterface("0x12345678")).to.eq(false);
  })
})
