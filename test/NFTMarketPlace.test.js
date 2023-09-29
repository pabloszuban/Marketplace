const { expect } = require("chai"); 
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NFTMarketplace", function () {

  let NFT;
  let nft;
  let Marketplace;
  let marketplace
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1;
  let URI = "sample URI"
  let URI2 = "sample URI 2" 

  beforeEach(async function () {
    // Get the ContractFactories and Signers here.
    NFT = await ethers.getContractFactory("NFT");
    Marketplace = await ethers.getContractFactory("Marketplace");
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contracts
    nft = await NFT.deploy();
    marketplace = await Marketplace.deploy(feePercent);
  });

  describe("Deployment", function () {

    it("Should track name and symbol of the nft collection", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      const nftName = "DApp NFT"
      const nftSymbol = "DAPP"
      expect(await nft.name()).to.equal(nftName);
      expect(await nft.symbol()).to.equal(nftSymbol);
    });

    it("Should track feeAccount and feePercent of the marketplace", async function () {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
      expect(await marketplace.feePercent()).to.equal(feePercent);
    });
  });

  describe("Minting NFTs", function () {

    it("Should track each minted NFT", async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);
      // addr2 mints an nft
      await nft.connect(addr2).mint(URI)
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
  })

  describe("Making marketplace items", function () {
    let result 
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 mint another nft
      await nft.connect(addr1).mint(URI2)
      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
    })


    it("Should track newly created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
      // addr1 offers their nft to the marketplace
      await expect(marketplace.connect(addr1).makeItem(nft.address, 1))
        .to.emit(marketplace, "Offered")
        .withArgs(
          1,
          nft.address,
          1,
          addr1.address
        )
      // addr1 offers their other nft to the marketplace
      await expect(marketplace.connect(addr1).makeItem(nft.address, 2))
        .to.emit(marketplace, "Offered")
        .withArgs(
          2,
          nft.address,
          2,
          addr1.address
        )
      // Owner of NFTS should now be the marketplace
      expect(await nft.ownerOf(1)).to.equal(marketplace.address);
      expect(await nft.ownerOf(2)).to.equal(marketplace.address);
      // Item count should now equal 2
      expect(await marketplace.itemCount()).to.equal(2)
      // Get item from items mapping then check fields to ensure they are correct. For the first item:
      const item = await marketplace.items(1)
      expect(item.itemId).to.equal(1)
      expect(item.nft).to.equal(nft.address)
      expect(item.tokenId).to.equal(1)
      expect(item.sold).to.equal(false)
      // The same but for the second item
      const item2 = await marketplace.items(2)
      expect(item2.itemId).to.equal(2)
      expect(item2.nft).to.equal(nft.address)
      expect(item2.tokenId).to.equal(2)
      expect(item2.sold).to.equal(false)

    });
  });
  describe("Purchasing marketplace items", function () {
    let price = 2
    priceInWei = toWei(price)
    console.log("Precio en wei", priceInWei)
    


    let fee = (feePercent/100)*price
    let totalPriceInWei
    

    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend tokens
      await nft.connect(addr1).setApprovalForAll(marketplace.address, true)
      // addr1 makes their nft a marketplace item.
      await marketplace.connect(addr1).makeItem(nft.address, 1)
    })
    it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
      const sellerInitalEthBal = await addr1.getBalance()
      console.log("sellerInitalEthBal:", sellerInitalEthBal)  
      const feeAccountInitialEthBal = await deployer.getBalance()
      // fetch items total price (market fees + price)
      totalPriceInWei = await marketplace.getTotalPrice(priceInWei);
      console.log("totalPriceInWei:", totalPriceInWei) 
      // addr 2 purchases item.
      await expect(marketplace.connect(addr2).purchaseItem(1, priceInWei, {value: totalPriceInWei}))
      .to.emit(marketplace, "Bought")
        .withArgs(
          1,
          nft.address,
          1,
          toWei(price),
          addr1.address,
          addr2.address
        )
      const sellerFinalEthBal = await addr1.getBalance()
      console.log("sellerFinalEthBal:", sellerFinalEthBal)
      const feeAccountFinalEthBal = await deployer.getBalance()
      // Item should be marked as sold
      expect((await marketplace.items(1)).sold).to.equal(true)
      // Seller should receive payment for the price of the NFT sold.
      expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal))
      // feeAccount should receive fee
      expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
      // The buyer should now own the nft
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    })
    it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
      // fails for invalid item ids
      await expect(
        marketplace.connect(addr2).purchaseItem(2, priceInWei ,{value: totalPriceInWei})
      ).to.be.revertedWith("item doesn't exist");
      await expect(
        marketplace.connect(addr2).purchaseItem(0, priceInWei ,{value: totalPriceInWei})
      ).to.be.revertedWith("item doesn't exist");
      // Fails when not enough ether is paid with the transaction. 
      // In this instance, fails when buyer only sends enough ether to cover the price of the nft
      // not the additional market fee.
      await expect(
        marketplace.connect(addr2).purchaseItem(1, priceInWei ,{value: toWei(price)})
      ).to.be.revertedWith("not enough ether to cover item price and market fee"); 
      // addr2 purchases item 1
      await marketplace.connect(addr2).purchaseItem(1, priceInWei ,{value: totalPriceInWei})
      // addr3 tries purchasing item 1 after its been sold 
      const addr3 = addrs[0]
      await expect(
        marketplace.connect(addr3).purchaseItem(1, priceInWei ,{value: totalPriceInWei})
      ).to.be.revertedWith("item already sold");
    });
  });
})