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

export default function MyExchanges({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState([]);

  const loadExchangedItems = async () => {
    //Buscamos los eventos bought pero solo los que tengan como buyer la cuenta del usuario
    const filter = marketplace.filters.Exchanged(null, null, null, null, account);
    //Una vez creado en filtro usamos queryFilter para buscar los eventos
    const results = await marketplace.queryFilter(filter);

    //Usamos Promise.all para esperar a que se resuelvan todas las promesas, ya que pueden haber varios eventos recolectados en results
    const exchanges = await Promise.all(
      results.map(async (i) => {
        i = i.args;
        console.log("seller:", i.seller);
        console.log("buyer:", i.buyer);

        return {
          itemId: i.itemId,
          tokenId: i.tokenId,
          seller: i.seller,
          buyer: i.buyer,//este da igual que el seller por un error en como defini las cosas.
        };
      })
    );

    setLoading(false);
    setExchanges(exchanges);
  };

  useEffect(() => {
    loadExchangedItems();
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
      {exchanges.length > 0 ? (
        <Grid container spacing={3}>
          {exchanges.map((item, idx) => (
            <Grid item key={idx} xs={12} sm={6} md={4} lg={3}>
              <Card>
                <CardContent>
                    <Typography variant="body1">{item.itemId._hex}</Typography>
                    <Typography variant="body1">{item.tokenId._hex}</Typography>
                    <Typography variant="body1">{item.seller}</Typography>
                    <Typography variant="body1">{item.buyer}</Typography>
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
