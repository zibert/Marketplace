// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract Zerc1155Token is ERC1155Supply {
    address owner;
    address minter;

    string public name;
    string public symbol;

    constructor(string memory _name, string memory _symbol, string memory _uri) ERC1155(_uri) {
        minter = msg.sender;
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
    }

    function mintTo(address _to, uint256 _id, uint256 _quantity) public onlyMinter {
        _mint(_to, _id, _quantity, "");
    }

    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts) 
        public {
            safeBatchTransferFrom(from, to, ids, amounts, "");
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount) public {
        safeTransferFrom(from, to, id, amount, "");
    }

    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
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