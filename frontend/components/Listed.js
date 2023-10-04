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

export default function MyListedItems({ marketplace, nft, account }) {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [acceptedItems, setAcceptedItems] = useState([])
  
  const loadListedItems = async () => {
   // Load all sold items that the user listed from the array sellers from the backend
  let listedItems = []
  let acceptedItems = []
  const loadAllMyItems = sellers;
  console.log('sellers en loadListedItems:', loadAllMyItems);
  console.log(account)
  for (const s of loadAllMyItems){
    console.log ("s.address:", s.address)
    if (s.address.toLowerCase() === account.toLowerCase()){
      console.log("entre");
      console.log("nfts:", s.nfts)
      for (const n of s.nfts){
        for (const b of n.buyers){
          if (b.accepted){
            acceptedItems.push(n);
          } else {
              listedItems.push(n);
              console.log("listedItems:", listedItems);
          }
        } 
      }
    }
  }
  setLoading(false)
  setListedItems(listedItems)
  setAcceptedItems(acceptedItems) 
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


  const handleAcceptOffer = async (seller, itemId, buyer) => {
    try {
      // Realiza una solicitud al backend para aceptar la oferta
      const response = await axios.put(`http://localhost:4000/accept-offer/${seller}/${itemId}/${buyer}`);
      setSellers(response.data);
      //buyMarketItem(itemId, price);
      console.log("sellers dentro de accept:", sellers);
    } catch (error) {
      console.error('Error al aceptar la oferta:', error);
    }
  };

  //const buyMarketItem = async (itemId,price) => {
  //  const totalPrice = await marketplace.getTotalPrice(price);
  //  console.log("totalPrice:", totalPrice);
  //  console.log("itemId:", itemId);
  //  console.log("price:", price);
  //  await (await marketplace.purchaseItem(itemId, price,{ value: totalPrice })).wait();
  //}



  useEffect(() => {
    createAllSellers();
    console.log("En listed creando sellers");
  }, []);
  useEffect(() => {
    loadListedItems();
    console.log("Eacaaaaaaaaaaa", sellers);
  }, [sellers]);
  useEffect(() => {
    loadListedItems();
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
      <h2>Listed Items</h2>
      {listedItems.length > 0 ? (
        <Grid container spacing={3}>
          {listedItems.map((item, idx) => (
            <Grid item key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card>
                <CardContent>
                  <Typography variant="body1">{item.seller}</Typography>
                  <Typography>
                  {item.buyers.map((buyer, idx) => (
                      <div key={idx}>
                        <Typography variant="body2">
                        {buyer.price ? (
                          `account ${buyer.buyer} wants ${buyer.name} for ${ethers.utils.formatEther(buyer.price)} ETH`
                        ) : (
                          `account ${buyer.buyer} wants ${buyer.name} for ${buyer.exchangeName}`
                        )}
                        </Typography>
                        {/* Agrega el botón "Accept" aquí */}
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            handleAcceptOffer(
                              account,
                              ethers.BigNumber.from(item.itemId).toNumber(), // Asegúrate de tener el valor correcto aquí
                              buyer.buyer,
                              //buyer.price,

                            )
                          }
                        >
                          Accept
                        </Button>
                      </div>
                    ))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6">No listed items</Typography>
      )}

      <h2>Accepted Items</h2>
      {acceptedItems.length > 0 ? (
        <Grid container spacing={3}>
          {acceptedItems.map((item, idx) => (
            <Grid item key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card>
                <CardContent>
                  <Typography variant="body1">{item.seller}</Typography>
                  <Typography>
                    {item.buyers.map((buyer, idx) => (
                        buyer.accepted && (
                            <Typography key={idx} variant="body2">
                            {buyer.price ? (
                              `account ${buyer.buyer} wants ${buyer.name} for ${ethers.utils.formatEther(buyer.price)} ETH`
                            ) : (
                              `account ${buyer.buyer} wants ${buyer.name} for ${buyer.exchangeName}`
                            )}
                            </Typography>
                        )
                    ))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6">No sold items</Typography>
      )}
    </Container>
  );
}