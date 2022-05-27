// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Zerc721Token is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;
    address minter;
    address owner;

    string public baseTokenURI;
    
    constructor(string memory _name, string memory _symbol, string memory _baseTokenURI) ERC721(_name, _symbol) {
        minter = msg.sender;
        owner = msg.sender;
        baseTokenURI = _baseTokenURI;
    }
    
    function mintTo(address _to) public onlyMinter {
        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _mint(_to, newItemId);
    }

    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function totalSupply() public view returns (uint256) {
        return currentTokenId.current();
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "not minter");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }
}