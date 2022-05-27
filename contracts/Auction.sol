// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "./Zerc721Token.sol";
import "./Zerc1155Token.sol";

contract Auction is IERC1155Receiver, IERC721Receiver {
    uint private constant DURATION = 3 days;

    bytes4 public constant IID_IERC1155_RECIEVER = type(IERC1155Receiver).interfaceId;
    bytes4 public constant IID_IERC721_RECIEVER = type(IERC721Receiver).interfaceId;

    uint128 itemsOnSaleCount;
    uint128 lotsOnAuctionCount;

    address owner;

    IERC20 erc20;
    Zerc721Token erc721;
    Zerc1155Token erc1155;

    struct Item {
        uint256 tokenId;
        uint256 amount;
        uint256 price;
        address owner;
        bool isActiv;
    }
    mapping(uint256 => Item) itemsOnSale;

    struct Lot {
        uint256 tokenId;
        uint256 amount;
        uint256 bidsCount;
        uint256 lastBidAmount;
        uint256 endAt;
        address lastBidAddress;
        address owner;
        bool isActiv;
    }
    mapping(uint256 => Lot) lotsOnAuction;

    event ItemOnSale(uint256 indexed itemId, address indexed owner, uint256 indexed tokenId, uint256 amount, uint256 price);
    event LotOnAuction(uint256 indexed lotId, address indexed owner, uint256 indexed tokenId, uint256 amount);

    constructor (address _erc20Address, address _erc721Address, address _erc1155Address) {
        owner = msg.sender;
        erc20 = IERC20(_erc20Address);
        erc721 = Zerc721Token(_erc721Address);
        erc1155 = Zerc1155Token(_erc1155Address);
    }

    function createItem() public {
        erc721.mintTo(msg.sender);
    }

    function createItem(uint256 _id, uint256 _amount) public {
        erc1155.mintTo(msg.sender, _id, _amount);
    }

    function listItem(uint256 _tokenId, uint256 _price) public {
        erc721.safeTransferFrom(msg.sender, address(this), _tokenId);
        itemsOnSale[itemsOnSaleCount].tokenId = _tokenId;
        itemsOnSale[itemsOnSaleCount].price = _price;
        itemsOnSale[itemsOnSaleCount].owner = msg.sender;
        itemsOnSale[itemsOnSaleCount].isActiv = true;
        emit ItemOnSale(itemsOnSaleCount, msg.sender, _tokenId, 0, _price);
        itemsOnSaleCount++;
    }

    function listItem(uint256 _tokenId, uint256 _amount, uint256 _price) public {
        erc1155.safeTransferFrom(msg.sender, address(this), _tokenId, _amount);
        itemsOnSale[itemsOnSaleCount].tokenId = _tokenId;
        itemsOnSale[itemsOnSaleCount].price = _price;
        itemsOnSale[itemsOnSaleCount].amount = _amount;
        itemsOnSale[itemsOnSaleCount].owner = msg.sender;
        itemsOnSale[itemsOnSaleCount].isActiv = true;
        emit ItemOnSale(itemsOnSaleCount, msg.sender, _tokenId, _amount, _price);
        itemsOnSaleCount++;
    }

    function getItem(uint256 _itemId) public view returns(Item memory ) {
        return itemsOnSale[_itemId];
    }

    function buyItem(uint256 _itemId) public {
        require(itemsOnSale[_itemId].isActiv, "trade position is not active");
        Item memory item = itemsOnSale[_itemId];
        erc20.transferFrom(msg.sender, address(this), item.price);
        erc20.transfer(item.owner, item.price);
        if (item.amount >= 1) {
            erc1155.safeTransferFrom(address(this), msg.sender, item.tokenId, item.amount);
        } else {
            erc721.safeTransferFrom(address(this), msg.sender, item.tokenId);
        }
        itemsOnSale[_itemId].isActiv = false;
    }

    function cancel(uint256 _itemId) public {
        require(itemsOnSale[_itemId].isActiv, "trade position is not active");
        require(itemsOnSale[_itemId].owner == msg.sender, "not owner");
        Item memory item = itemsOnSale[_itemId];
        if (item.amount >= 1) {
            erc1155.safeTransferFrom(address(this), item.owner, item.tokenId, item.amount);
        } else {
            erc721.safeTransferFrom(address(this), item.owner, item.tokenId);
        }
        itemsOnSale[_itemId].isActiv = false;
    }

    function listItemOnAuction(uint256 _tokenId) public {
        erc721.safeTransferFrom(msg.sender, address(this), _tokenId);
        lotsOnAuction[lotsOnAuctionCount].tokenId = _tokenId;
        lotsOnAuction[lotsOnAuctionCount].endAt = block.timestamp + DURATION;
        lotsOnAuction[lotsOnAuctionCount].owner = msg.sender;
        lotsOnAuction[lotsOnAuctionCount].isActiv = true;
        emit LotOnAuction(lotsOnAuctionCount, msg.sender, _tokenId, 0);
        lotsOnAuctionCount++;
    }

    function listItemOnAuction(uint256 _tokenId, uint256 _amount) public {
        erc1155.safeTransferFrom(msg.sender, address(this), _tokenId, _amount);
        lotsOnAuction[lotsOnAuctionCount].tokenId = _tokenId;
        lotsOnAuction[lotsOnAuctionCount].endAt = block.timestamp + DURATION;
        lotsOnAuction[lotsOnAuctionCount].owner = msg.sender;
        lotsOnAuction[lotsOnAuctionCount].isActiv = true;
        lotsOnAuction[lotsOnAuctionCount].amount = _amount;
        emit LotOnAuction(lotsOnAuctionCount, msg.sender, _tokenId, _amount);
        lotsOnAuctionCount++;
    }

    function getLot(uint256 _lotId) public view returns(Lot memory) {
        return lotsOnAuction[_lotId];
    }

    function makeBid(uint256 _lotId, uint256 _bid) public {
        require(lotsOnAuction[_lotId].isActiv, "auction is not active");
        require(lotsOnAuction[_lotId].endAt > block.timestamp, "auction is ended");
        require(lotsOnAuction[_lotId].lastBidAmount < _bid, "bid is less than current");

        Lot memory lot = lotsOnAuction[_lotId];

        if (lotsOnAuction[_lotId].lastBidAmount > 0) {
            erc20.transfer(lot.lastBidAddress, lot.lastBidAmount);
        }
        erc20.transferFrom(msg.sender, address(this), _bid);

        lotsOnAuction[_lotId].bidsCount++;
        lotsOnAuction[_lotId].lastBidAmount = _bid;
        lotsOnAuction[_lotId].lastBidAddress = msg.sender;
    }

    function finishAuction(uint256 _lotId) public {
        require(lotsOnAuction[_lotId].isActiv, "auction is not active");
        require(lotsOnAuction[_lotId].endAt < block.timestamp, "auction is still in progress");

        Lot memory lot = lotsOnAuction[_lotId];

        if (lotsOnAuction[_lotId].bidsCount < 2) {
            erc20.transfer(lot.lastBidAddress, lot.lastBidAmount);
            if (lot.amount >= 1) {
                erc1155.safeTransferFrom(address(this), lot.owner, lot.tokenId, lot.amount);
            } else {
                erc721.safeTransferFrom(address(this), lot.owner, lot.tokenId);
            }
        } else {
            erc20.transfer(lot.owner, lot.lastBidAmount);
            if (lot.amount >= 1) {
                erc1155.safeTransferFrom(address(this), lot.lastBidAddress, lot.tokenId, lot.amount);
            } else {
                erc721.safeTransferFrom(address(this), lot.lastBidAddress, lot.tokenId);
            }
        }

        lotsOnAuction[_lotId].isActiv = false;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == IID_IERC1155_RECIEVER || interfaceId == IID_IERC721_RECIEVER;
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) 
        external override returns (bytes4) {
            return this.onERC721Received.selector;
    }

    function onERC1155Received(address operator, address from, uint256 id, uint256 value, bytes calldata data) 
        external override returns (bytes4) {
            return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) 
        external override returns (bytes4) {
            return this.onERC1155BatchReceived.selector;
    }
}