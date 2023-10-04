import React, { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, TextField } from '@mui/material';

const Create = ({ marketplace, nft }) => {
  //The image, name and description represent the nft metadata, which will be uploaded to IPFS
  //const [image, setImage] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createNFT = async () => {
    if ( !name || !description) return;

    try {
      // We add to IPFS the metadata of the nft, which is a JSON file with the name and description of the nft
      const result = JSON.stringify({ name, description });
      await mintThenList(result);
    } catch (error) {
      console.log('URI upload error: ', error);
    }
  };

  const mintThenList = async (result) => {
    // We make the uri of the nft, which is the link to the metadata of the nft on IPFS
    const uri = result;
    
    try {
      // Mint NFT
      const mintTransaction = await nft.mint(uri);
      await mintTransaction.wait();

      // Get the tokenId of the new NFT
      const id = await nft.tokenCount();

      // Approve marketplace to spend NFT. But firs we check if the user has already approved the marketplace to spend all his NFTs. This means that the user has already used the marketplace before.
      const OwnerOf = await nft.ownerOf(id);
      console.log('OwnerOf: ', OwnerOf);
      const isApproved = await nft.isApprovedForAll(OwnerOf,marketplace.address);
      
      console.log('isApproved: ', isApproved);
      if (!isApproved) {
        const approvalTransaction = await nft.setApprovalForAll(marketplace.address, true);
        await approvalTransaction.wait();
      }

      // Add NFT to the marketplace
      const makeItemTransaction = await marketplace.makeItem(nft.address, id);
      await makeItemTransaction.wait();
    } catch (error) {
      console.log('Error while minting and listing NFT: ', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Create & List NFT</Typography>
      <form>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              variant="outlined"
              required
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              required
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              onClick={createNFT}
            >
              Create & List NFT
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default Create;
