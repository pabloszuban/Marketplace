import { Typography } from '@mui/material'
import { useState, useEffect } from 'react'
import {
    Container,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Button,
} from '@mui/material';
import axios from 'axios'; // Asegúrate de importar axios
import { ethers } from "ethers";

export default function MyBidItems({ marketplace, nft, account }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true)
  const [acceptedBids, setAcceptedBids] = useState([])
  
  const loadBidItems = async () => {
   // Load all sold items that the user listed from the array sellers from the backend
  let acceptedBids = []
  const loadAllMyItems = sellers;
  //console.log('sellers en loadListedItems:', loadAllMyItems);
  //console.log(account)
  for (const s of loadAllMyItems){
      for (const n of s.nfts){
        if (!n.inSale){
            for (const b of n.buyers){
                if (b.accepted && b.buyer.toLowerCase() === account.toLowerCase()){
                    acceptedBids.push(n);
                }
            } 
        }
      }
  }
  setLoading(false)
  setAcceptedBids(acceptedBids)
  }

  // Esta función hará la solicitud al backend para crear a todos los vendedores en el backend y permitir las negociaciones
  const createAllSellers = async () => {
    try {
      const response = await axios.post('http://localhost:4000/create-all-sellers');
      console.log('Vendedores creados con éxito:', response.data);
      setSellers(response.data);
      console.log("sellers:", sellers);
      //loadListedItems();
    } catch (error) {
      console.error('Error al crear vendedores:', error);
    }
  }


  const handleMakeTransaction = async (itemId, price) => {
    try {
      buyMarketItem(itemId, price);
      console.log("sellers dentro de accept:", sellers);
    } catch (error) {
      console.error('Error al aceptar la oferta:', error);
    }
  };

  const handleMakeExchange = (itemId, exchangeTokenId) => {
    try {
      exchangeMarketItem(itemId, exchangeTokenId);
      console.log("sellers dentro de accept:", sellers);
    } catch (error) {
      console.error('Error al aceptar la oferta:', error);
    }
  };

  const buyMarketItem = async (itemId,price) => {
    const totalPrice = await marketplace.getTotalPrice(price);
    console.log("totalPrice:", totalPrice);
    console.log("itemId:", itemId);
    console.log("price:", price);
    await (await marketplace.purchaseItem(itemId, price,{ value: totalPrice })).wait();
    createAllSellers();
  }

  const exchangeMarketItem = async (itemId, exchangeTokenId) => {
    console.log("exchangeTokenId:", exchangeTokenId);
    console.log("itemId:", itemId);
    await (await marketplace.exchangeItem(itemId, exchangeTokenId)).wait();
    createAllSellers();
  }


  useEffect(() => {
    createAllSellers();
    console.log("En listed creando sellers");
  }, []);
  useEffect(() => {
    loadBidItems();
    console.log("Eacaaaaaaaaaaa", sellers);
  }, [sellers]);
  useEffect(() => {
    loadBidItems();
  }, []);
  
  if (loading) {
    return (
      <Container style={{ padding: "1rem 0" }}>
        <CircularProgress />
      </Container>
    );
  }
  return (
    <Container>
      <h2>See your accepted price and exchange proposals and confirm transaction</h2>
      {acceptedBids.length > 0 ? (
        <Grid container spacing={3}>
        {acceptedBids.map((item, idx) => (
          // Verifica el valor de inSale para decidir si mostrar el artículo
          !item.inSale && (
            <Grid item key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card>
                <CardContent>
                  <Typography variant="body1">{item.seller}</Typography>
                  <Typography>
                    {item.buyers.map((buyer, idx) => (
                      <div key={idx}>
                        <Typography variant="body2">
                          {buyer.price
                            ? `Buy for: ${ethers.utils.formatEther(buyer.price)} ETH`
                            : `Account ${buyer.buyer} wants ${buyer.name} for ${buyer.exchangeName}`}
                        </Typography>
                        {/* Verifica si buyer.price existe */
                        buyer.price ? (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              handleMakeTransaction(
                                ethers.BigNumber.from(item.itemId).toNumber(),
                                buyer.price
                              )
                            }
                          >
                            Buy NFT
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              handleMakeExchange(
                                ethers.BigNumber.from(item.itemId).toNumber(),
                                buyer.exchangeTokenId // Asegúrate de que esto sea correcto
                              )
                            }
                          >
                            Exchange NFT
                          </Button>
                        )}
                      </div>
                    ))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        ))}
      </Grid>
      ) : (
        <Typography variant="h6">No accepted proposals</Typography>
      )}
    </Container>
  );
}