# Auction

# Install package

npm i

# Test

npx hardhat coverage<br />

# Deploy

npx hardhat run --network rinkeby scripts/deployERC721.ts<br />
npx hardhat run --network rinkeby scripts/deployERC1155.ts<br />
npx hardhat run --network rinkeby scripts/deployAuction.ts<br />

# Verify

npx hardhat verify --network rinkeby --constructor-args argumentsErc721.js 0xD9Ce0d418a051b16124c747A39d813e1275842B7 <br />
https://rinkeby.etherscan.io/address/0xD9Ce0d418a051b16124c747A39d813e1275842B7#code<br />

npx hardhat verify --network rinkeby --constructor-args argumentsErc1155.js 0x83B7fBEB91a7db7D90E75A8dB27D2ec6B51E19cB<br />
https://rinkeby.etherscan.io/address/0x83B7fBEB91a7db7D90E75A8dB27D2ec6B51E19cB#code<br />

npx hardhat verify --network rinkeby --constructor-args argumentsAuction.js 0xd9aFB0cE2b6f82DE94f847c9F2e88a09d2D25ACE<br />
https://rinkeby.etherscan.io/address/0xd9aFB0cE2b6f82DE94f847c9F2e88a09d2D25ACE#code<br />

# Tasks 

## setMinter to Auction for Tokens

npx hardhat setMinter721 --network rinkeby<br />
npx hardhat setMinter1155 --network rinkeby<br />

## addZcoins example

npx hardhat addZcoins --network rinkeby --to-account 0x624c31357a67344f6d0278a6ef1F839E2136D735 --amount 100.0<br />

## addZcoins example

npx hardhat mint721 --network rinkeby<br />

### Token ERC721 example:
https://testnets.opensea.io/assets/rinkeby/0xD9Ce0d418a051b16124c747A39d813e1275842B7/1<br />
https://rinkeby.rarible.com/token/0xd9ce0d418a051b16124c747a39d813e1275842b7:1?tab=details<br />

npx hardhat mint1155 --network rinkeby --id 1 --amount 42<br />

### Token ERC1155 example
https://testnets.opensea.io/assets/rinkeby/0x83B7fBEB91a7db7D90E75A8dB27D2ec6B51E19cB/1<br />
https://rinkeby.rarible.com/token/0x83b7fbeb91a7db7d90e75a8db27d2ec6b51e19cb:1?tab=owners

## listItem example

npx hardhat listItem721 --network rinkeby --token-id 1 --price 5.0<br />

npx hardhat listItem1155 --network rinkeby --id 1 --amount 21 --price 5.0<br />


## buy example

npx hardhat buy --network rinkeby --item-id 0 --price 5.0

## cancel example

npx hardhat cancel --network rinkeby --item-id 1

## listItemOnAuction example

npx hardhat listItemOnAuction721 --network rinkeby --token-id 1<br />

npx hardhat listItemOnAuction1155 --network rinkeby --id 1 --amount 21

## bid example

npx hardhat bid --network rinkeby --lot-id 0 --price 5.0<br />

## finish example
npx hardhat finish --network rinkeby --lot-id 1<br />

