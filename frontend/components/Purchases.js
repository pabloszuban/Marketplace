import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Typography,
} from '@mui/material';

export default function MyPurchases({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);

  const loadPurchasedItems = async () => {
    //Buscamos los eventos bought pero solo los que tengan como buyer la cuenta del usuario
    const filter = marketplace.filters.Bought(null, null, null, null, null, account);
    //Una vez creado en filtro usamos queryFilter para buscar los eventos
    const results = await marketplace.queryFilter(filter);

    //Usamos Promise.all para esperar a que se resuelvan todas las promesas, ya que pueden haber varios eventos recolectados en results
    const purchases = await Promise.all(
      results.map(async (i) => {
        i = i.args;
        const totalPrice = await marketplace.getTotalPrice(i.price);
        console.log("seller:", i.seller);
        console.log("buyer:", i.buyer);

        return {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          seller: i.seller,
          buyer: i.buyer,//este da igual que el seller por un error en como defini las cosas.
        };
      })
    );

    setLoading(false);
    setPurchases(purchases);
  };

  useEffect(() => {
    loadPurchasedItems();
  }, []);

  if (loading) {
    return (
      <Container style={{ padding: '1rem 0' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {purchases.length > 0 ? (
        <Grid container spacing={3}>
          {purchases.map((item, idx) => (
            <Grid item key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card>
                <CardContent>
                    <Typography variant="body1">{item.seller}</Typography>
                  <Typography variant="body1">
                    {ethers.utils.formatEther(item.totalPrice)} ETH
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6">No purchases</Typography>
      )}
    </Container>
  );
}
