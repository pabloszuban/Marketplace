const express = require("express");
const cors = require("cors");
const app = express();
// Configura CORS
app.use(cors());
const bodyParser = require("body-parser");
const { ethers } = require("hardhat");
const marketPlaceAddress = require("../deployments/contractsData/Marketplace-address.json");
const marketPlaceABI = require("../deployments/contractsData/Marketplace.json");
const NFTContractAddress = require("../deployments/contractsData/NFT-address.json");
const NFTContractABI = require("../deployments/contractsData/NFT.json");

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

// Lista en memoria de vendedores y sus NFT
let sellers = [];

// Función para crear un vendedor y su información en el Marketplace
async function createSeller(address, marketplaceContract, NFTContract) {
  //const sellerWallet = new ethers.Wallet(privateKey, provider);
  const sellerNFTs = [];
  const itemCount = await marketplaceContract.itemCount();
  console.log("itemCount:", itemCount);
  for (let i=1; i<=itemCount; i++){
      const item = await marketplaceContract.items(i);
      if (item.seller === address){
          const uri = await NFTContract.tokenURI(item.tokenId);
          const uriJSON = JSON.parse(uri);
          const name = uriJSON.name;
          //const description = uriJSON.description;
          sellerNFTs.push({ name: name, itemId: item.itemId ,tokenId: item.tokenId, inSale: item.sold, buyers: [] });
      }
  }
  sellers.push({
    address,
    nfts: sellerNFTs,
  });
}

// Hasta aca creamos una funcion que toma una cuenta y devuelve la info de sus items. Inicializa en falso que estan en venta y sin compradores. Luego hace un push a la lista de sellers con la cuenta y sus nfts.

//Lo ideal seria que ahora exista una función que llame a la anterior para cada cuenta en el marketplace. Para ello hacemos una funcion que recorra todos los items del marketplace y cree un array de cuentas mediante el atributo item.seller. Puede suceder que ya esté creada la cuenta, por lo que habría que hacer un if para que no se duplique.

// Función para crear todos los vendedores del Marketplace

async function createAllSellers(marketplaceContract, NFTContract) {
  //sellers = []; 
  const itemCount = await marketplaceContract.itemCount();
  console.log("itemCount:", itemCount);
  for (let i=1; i<=itemCount; i++){
      const item = await marketplaceContract.items(i);
      if (!item.sold){
          const seller = item.seller;
          let sellerExists = false;
          for (const s of sellers){
              if (s.address === seller){
                  sellerExists = true;
                  break;
              }
          }
          if (!sellerExists){
              await createSeller(seller, marketplaceContract, NFTContract);
          }
      }
  }
  console.log("sellers:", sellers);
}



// Crea vendedores con sus respectivas direcciones y claves privadas
//createSeller(addr1);
//createSeller(addr2);

//Ahora necesitamos crear una funcion que tome un seller del array de sellers y uno de los tokenId de sus items, verifique que esté en venta, y si lo está, que le permita  hacer un push de buyers con la cuenta del comprador y el precio de la oferta.

// Función para que un comprador realice una oferta en un NFT

async function makeOffer(seller, tokenId, buyer, price) {
  let indexToUpdate = -1;
  console.log("sellers:", sellers);
  // Convierte el tokenId a un objeto BigNumber
  const tokenIdToFind = ethers.BigNumber.from(tokenId);
  for (const s of sellers){
    if (s.address === seller){
      console.log("s.address:", s.address);
      console.log("s.nfts",s.nfts)
      console.log("lengt", s.nfts.length)
      console.log(s.nfts[1])
      console.log(s.nfts[0].tokenId.toNumber())
      console.log("tokenId", tokenId)
      for (let i = 0; i < s.nfts.length; i++) {
        if (s.nfts[i].tokenId.eq(tokenIdToFind)) {
          console.log("entre al if")
          indexToUpdate = i;
          console.log("indexToUpdate:", indexToUpdate);
          break; // Detenemos la búsqueda una vez que encontramos el elemento
        }
      }
    // Agrega la oferta al NFT
    console.log(s.nfts[indexToUpdate].buyers)
    s.nfts[indexToUpdate].buyers.push({ buyer, price, accepted: false });
        }
  }
}  

//Funcion para hacer un exchange

async function makeExchangeOffer(seller, tokenId, buyer, exchangeTokenId, name, exchangeName) {
  let indexToUpdate = -1;
  console.log("sellers:", sellers);
  // Convierte el tokenId a un objeto BigNumber
  const tokenIdToFind = ethers.BigNumber.from(tokenId);
  for (const s of sellers){
    if (s.address === seller){
      for (let i = 0; i < s.nfts.length; i++) {
        if (s.nfts[i].tokenId.eq(tokenIdToFind)) {
          console.log("entre al if")
          indexToUpdate = i;
          console.log("indexToUpdate:", indexToUpdate);
          break; // Detenemos la búsqueda una vez que encontramos el elemento
        }
      }
    // Agrega la oferta al NFT
    console.log(s.nfts[indexToUpdate].buyers)
    s.nfts[indexToUpdate].buyers.push({ buyer, name, exchangeName: exchangeName ,exchangeTokenId, accepted: false });
        }
  }
} 

//Luego necesitamos una funcion que le permita a un seller aceptar una oferta. Para eso debe recibir un seller y un tokenId, verificar que esté en venta, y si lo está poder marcar la oferta como aceptada.

// Función para que un vendedor acepte una oferta en un NFT

async function acceptOffer(seller, itemId, buyer) { 
  let indexToUpdate = -1;
  const itemIdToFind = ethers.BigNumber.from(itemId);
  for (const s of sellers){
    if (s.address.toLowerCase() === seller.toLowerCase()){
      console.log("s.address:", s.address);
      console.log("seller:", seller);
      console.log("entre al if")
      console.log("s.nfts.length:", s.nfts.length);
      for (let i = 0; i < s.nfts.length; i++) {
        console.log("s.nfts[i].itemId:", s.nfts[i].itemId);
        console.log("itemIdToFind:", itemIdToFind);
        if (s.nfts[i].itemId.eq(itemIdToFind)) {
          indexToUpdate = i;
          break; // Detenemos la búsqueda una vez que encontramos el elemento
        }
      }
    }
  }
  for (const s of sellers){
    if (s.address.toLowerCase() === seller.toLowerCase()){
      for (let i = 0; i < s.nfts[indexToUpdate].buyers.length; i++) {
        if (s.nfts[indexToUpdate].buyers[i].buyer === buyer) {
          s.nfts[indexToUpdate].buyers[i].accepted = true;
          break; // Detenemos la búsqueda una vez que encontramos el elemento
        }
      }
    }
  }
}

//Por ultimo, necesitamos una funcion que ejecute la transaccion, usando la función purchase del marketplace. PERO ESO RECIEN VA EN EL FRONTEND.


// Connect to local Ethereum node
const provider = new ethers.providers.JsonRpcProvider();

// Get signers 
const main = async () => {

  const [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

  console.log("Dirección del deployer:", deployer.address);
  console.log("Dirección de addr1:", addr1.address);
  console.log("Dirección de addr2:", addr2.address);

  // set their private keys
  deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  console.log("deployerPrivateKey:", deployerPrivateKey);
  //addr1PrivateKey= "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  //addr2PrivateKey= "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

  // Dirección del contrato del Marketplace y ABI del contrato (asegúrate de reemplazarlos con los valores correctos)
  const marketplaceAddress = marketPlaceAddress.address;
  const marketplaceABI = marketPlaceABI.abi;
  const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);

  // Conecta al contrato del Marketplace
  const marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceABI, deployerWallet);

  // Lo mismo para el contrato del NFT
  const nftContractAddress = NFTContractAddress.address;
  const nftContractABI = NFTContractABI.abi;
  
  // Conecta al contrato del NFT
  const NFTContract = new ethers.Contract(nftContractAddress, nftContractABI, deployerWallet);

  app.use(bodyParser.json());

  // Ruta para crear un vendedor
  app.post("/create-all-sellers", async (req, res) => {
    try {
      //sellers = [];
      await createAllSellers(marketplaceContract, NFTContract);
      res.status(200).json(sellers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al crear el vendedor" });
    }
  });

  // Ruta para hacer una oferta en un NFT
  app.post("/make-offer/:seller/:tokenId/:buyer/:price", async (req, res) => {
    const { seller, tokenId, buyer, price } = req.params;
    try {
      await makeOffer(seller, tokenId, buyer, price);
      res.status(200).json({ message: "Oferta realizada con éxito", sellers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al realizar la oferta" });
    }
  });

  //Ruta para hacer un exchange
  app.post("/make-exchange-offer/:seller/:tokenId/:buyer/:exchangeTokenId/:name/:exchangeName", async (req, res) => {
    const { seller, tokenId, buyer, exchangeTokenId, name, exchangeName } = req.params;
    try {
      await makeExchangeOffer(seller, tokenId, buyer, exchangeTokenId, name, exchangeName);
      res.status(200).json({ message: "Oferta realizada con éxito", sellers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al realizar la oferta" });
    }
  });

  // Ruta para aceptar una oferta en un NFT
  app.put("/accept-offer/:seller/:itemId/:buyer", async (req, res) => {
    const { seller, itemId, buyer } = req.params;
    try {
      await acceptOffer(seller, itemId, buyer);
      res.status(200).json(sellers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al aceptar la oferta" });
    }
  });

  // Agrega más rutas según tus necesidades

  // Manejo de otros casos y middleware de error
  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  // Middleware de manejo de errores
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
  });

  // Inicia el servidor
  const port = 4000;
  app.listen(port, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${port}`);
  });
};

main()
  .then(() => console.log("Aplicación iniciada correctamente"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });