import React, { useState, useEffect } from 'react';
import { Container, CircularProgress, Grid, Card, CardContent, CardActions, Button, Typography, TextField } from '@mui/material';
import { ethers } from "ethers";
import axios from 'axios';

const Home = ({ marketplace, nft, account }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [offerPrice, setOfferPrice] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [selectedExchangeTokenId, setSelectedExchangeTokenId] = useState(null);
  const [selectedExchangeItemId, setSelectedExchangeItemId] = useState(null);
  const [selectedExchangeName, setSelectedExchangeName] = useState('');
  const [userNFTs, setUserNFTs] = useState([]); // Almacenar NFTs del usuario

  const loadMarketplaceItems = async () => {
    const itemCount = await marketplace.itemCount();
    let items = [];
    let userNFTs = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await marketplace.items(i);
      if (!item.sold) {
        const uri = await nft.tokenURI(item.tokenId);
        //console.log("uri:", uri);
        //At this point uri is something like uri: {"name":"q","description":"q"}
        //We need to parse it to JSON
        const uriJSON = JSON.parse(uri);
        console.log("uriJSON:", uriJSON);
        // we set the name from that
        const name = uriJSON.name;
        console.log("name:", name);
        // we set the description from that
        const description = uriJSON.description;
        //console.log("description:", description);

        items.push({
          itemId: item.itemId,
          seller: item.seller,
          name: name,
          description: description,
        });

        //If item.seller is equal to account, then we add the item to the userNFTs array
        if (item.seller.toLowerCase() === account.toLowerCase()) {
          userNFTs.push({
            itemId: item.itemId,
            name: name,
            description: description,
          });
        }
      }
      
    }
    setLoading(false);
    setItems(items);
    setUserNFTs(userNFTs);
  }

  

  const handleOfferPriceChange = (event) => {
    setOfferPrice(event.target.value);
  }

  // Función para manejar la selección de un NFT para el intercambio
  const handleExchangeTokenSelect = (itemId) => {
    setSelectedExchangeItemId(itemId);
  };

  const createAllSellers = async () => {
    try {
      const response = await axios.post('http://localhost:4000/create-all-sellers');
      console.log('Vendedores creados con éxito:', response.data);
      setSellers(response.data);
      console.log("sellers:", sellers);
    } catch (error) {
      console.error('Error al crear vendedores:', error);
    }
  }

  const makeOffer = async (item) => {
    try {
      const seller = item.seller;
      const tokenId = item.itemId;
      const buyer = account;
      const price = ethers.utils.parseEther(offerPrice);

      await createAllSellers();
    
      const response = await axios.post(`http://localhost:4000/make-offer/${seller}/${tokenId}/${buyer}/${price}`);
      
      console.log('Oferta realizada con éxito:', response.data);

      setSellers(response.data);

    } catch (error) {
      console.error('Error al realizar la oferta:', error);
    }
  }


  const makeExchangeOffer = async (item) => {
    try {
      const seller = item.seller;
      const tokenId = item.itemId;
      const buyer = account;
      const exchangeTokenId = selectedExchangeTokenId;
      const name = item.name;
      //const exchangeName = selectedExchangeName;

      console.log("exchangeTokenId:", exchangeTokenId);

      const bigNumberifyExchangeTokenId = ethers.BigNumber.from(exchangeTokenId);

      console.log("bigNumberifyExchangeTokenId:", bigNumberifyExchangeTokenId);

      //console.log(items);

      //console.log(item);

      console.log(items.find((item) => item.itemId.eq(bigNumberifyExchangeTokenId)));
      
      // Search for the name of the exchange token
      const selectedExchangeItem = items.find((item) => item.itemId.eq(bigNumberifyExchangeTokenId));
      const exchangeName = selectedExchangeItem.name;

      await createAllSellers();

      //const exchangeName = await getName(exchangeTokenId);
      //console.log("exchangeName:", exchangeName);
    
      const response = await axios.post(`http://localhost:4000/make-exchange-offer/${seller}/${tokenId}/${buyer}/${exchangeTokenId}/${name}/${exchangeName}`);
      
      console.log('Oferta realizada con éxito:', response.data);

      setSellers(response.data);

    } catch (error) {
      console.error('Error al realizar la oferta:', error);
    }
  }

  useEffect(() => {
    loadMarketplaceItems();
  }, []);

  if (loading) return (
    <Container style={{ padding: "1rem 0" }}>
      <CircularProgress />
    </Container>
  );

  return (
  <Container>
    {items.length > 0 ? (
      <Grid container spacing={3}>
        {items.map((item, idx) => (
          <Grid item key={idx} xs={12} sm={10} md={7} lg={5}>
            <Card>
              <CardContent style={{ minWidth: '150px' }}>
                <Typography variant="body1"> Seller: {item.seller}</Typography>
                <Typography variant="h6">Name: {item.name}</Typography>
                <Typography variant="body2">Description: {item.description}</Typography>
              </CardContent>
              <CardActions>
                {account.toLowerCase() !== item.seller.toLowerCase() && (
                  <>
                    <Button
                      onClick={() => {
                        setSelectedItemIndex(idx);
                        setOfferPrice('');
                        setSelectedExchangeTokenId(null); // Reiniciar el token de intercambio
                      }}
                      variant="contained"
                      color="primary"
                    >
                      Make an Offer
                    </Button>
                    <Button
                      onClick={() => handleExchangeTokenSelect(item.itemId)}
                      variant="contained"
                      color="secondary"
                    >
                      Exchange for one of your NFTs
                    </Button>
                  </>
                )}
              </CardActions>
              {selectedItemIndex === idx && (
                <CardContent>
                  <TextField
                    label="Offer Price (ETH)"
                    variant="outlined"
                    value={offerPrice}
                    onChange={handleOfferPriceChange}
                  />
                  <Button
                    onClick={() => makeOffer(item)}
                    variant="contained"
                    color="primary"
                  >
                    Submit Offer
                  </Button>
                </CardContent>
              )}
              {selectedExchangeItemId === item.itemId && (
                <CardContent>
                  <Typography variant="subtitle1">Select one of your NFTs to exchange:</Typography>
                  <select
                    value={selectedExchangeTokenId}
                    onChange={(e) => {
                      setSelectedExchangeTokenId(e.target.value)
                    }}
                  >
                    <option value="">Select an NFT</option>
                    {userNFTs.map((userNFT) => (
                      <option key={userNFT.itemId._hex} value={userNFT.itemId}>
                        {userNFT.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => makeExchangeOffer(item)}
                    variant="contained"
                    color="primary"
                  >
                    Exchange
                  </Button>
                </CardContent>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    ) : (
      <Container style={{ padding: "1rem 0" }}>
        <Typography variant="h4">No listed assets</Typography>
      </Container>
    )}
  </Container>
);

}

export default Home;
