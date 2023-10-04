const { ethers } = require("hardhat");
const NFTContractAddress = require("../deployments/contractsData/NFT-address.json");
const NFTContractABI = require("../deployments/contractsData/NFT.json");
const marketPlaceAddress = require("../deployments/contractsData/Marketplace-address.json");
const marketPlaceABI = require("../deployments/contractsData/Marketplace.json");
async function main() {
    // Connect to local Ethereum node
    const provider = new ethers.providers.JsonRpcProvider();
    const [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    console.log("Dirección del deployer:", deployer.address);
    console.log("Dirección de addr1:", addr1.address);
    console.log("Dirección de addr2:", addr2.address);

    // set their private keys
    deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    console.log("deployerPrivateKey:", deployerPrivateKey);
    addr1PrivateKey= "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    addr2PrivateKey= "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

    // Dirección del contrato del Marketplace y ABI del contrato 
    const marketplaceAddress = marketPlaceAddress.address;
    console.log("marketplaceAddress:", marketplaceAddress);
    const marketplaceABI = marketPlaceABI.abi;
    const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);

    // Conecta al contrato del Marketplace
    const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceABI, deployerWallet);

    // Lo mismo para el contrato del NFT
    const nftContractAddress = NFTContractAddress.address;
    const nftContractABI = NFTContractABI.abi;

    // Conecta al contrato del NFT
    const NFTContract = new ethers.Contract(nftContractAddress, nftContractABI, deployerWallet);

    //Set URIs for NFTs
    const name = "NFT"
    const description = "NFT description"
    const name1 = "NFT1"
    const description1 = "NFT 1 description"
    const name2 = "NFT2"
    const description2 = "NFT 2 description"
    const URI = JSON.stringify({ name: name, description: description});
    const URI2 = JSON.stringify({ name: name1, description: description1 });
    const URI3 = JSON.stringify({ name: name2, description: description2});


    // addr1 mints an nft
    await NFTContract.connect(addr1).mint(URI)
    // addr1 mint another nft
    await NFTContract.connect(addr1).mint(URI2)
    // addr1 approves marketplace to spend nft
    await NFTContract.connect(addr1).setApprovalForAll(marketplaceContract.address, true)


    // addr1 offers their nft to the marketplace
    await marketplaceContract.connect(addr1).makeItem(NFTContract.address, 1)

    // addr1 offers their other nft to the marketplace
    await marketplaceContract.connect(addr1).makeItem(NFTContract.address, 2)

    // The same but for addr2
    await NFTContract.connect(addr2).mint(URI3)
    await NFTContract.connect(addr2).setApprovalForAll(marketplaceContract.address, true)
    await marketplaceContract.connect(addr2).makeItem(NFTContract.address, 3)

}
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });