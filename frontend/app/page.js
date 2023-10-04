"use client";
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import { ethers } from "ethers";
import { useState } from "react";
const NFTContractAddress = require("../../deployments/contractsData/NFT-address.json");
const NFTContractABI = require("../../deployments/contractsData/NFT.json");
const marketPlaceAddress = require("../../deployments/contractsData/Marketplace-address.json");
const marketPlaceABI = require("../../deployments/contractsData/Marketplace.json");
import Navigation from '../components/Navbar';
import Home from '../components/Home'
import MyListedItems from '../components/Listed'
import MyPurchases from '../components/Purchases'
import MyExchanges from '../components/Exchanges'
import MyBids from '../components/Offers'
import MintAndMakeItems from '../components/mintAndMakeItems'

function App() {
  // Track when our app is loading the blockchain data, so we know when to render the view
  const [loading, setLoading] = useState(true);
  const  [account, setAccount] = useState(null);
  // Store each contract in a state variable
  const [marketplace, setMarketplace] = useState(null);
  const [nft, setNFT] = useState(null);
  //Metamask login/connect
  const web3Handler = async () => {
    // fetch accounts from metamask wallet. It returns an array of accounts, where the first account is the users current account.
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0])
    console.log("accounts[0]", accounts[0])
    console.log("account", account)
    // Get provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // Get signer from the provider
    const signer = provider.getSigner();
    loadContracts(signer)
  }

  const loadContracts = async (signer) => {
    // Get deployed copies of contracts
    const marketplace = new ethers.Contract(marketPlaceAddress.address, marketPlaceABI.abi, signer)
    setMarketplace(marketplace)
    const nft = new ethers.Contract(NFTContractAddress.address, NFTContractABI.abi, signer)
    setNFT(nft)
    setLoading(false)
  }

  return (
    <BrowserRouter >
      <div className="App" >
        <Navigation web3Handler={web3Handler} account={account} />
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh'}}>
              <CircularProgress style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home marketplace={marketplace} nft={nft} account={account} />} />
              <Route path="/create" element={<MintAndMakeItems marketplace={marketplace} nft={nft}      />} />
              <Route path="/my-listed-items" element={
                <MyListedItems marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-bids" element={
                <MyBids marketplace={marketplace} nft={nft} account={account} />
              } />
              <Route path="/my-exchanges" element={
                <MyExchanges marketplace={marketplace} nft={nft} account={account} />
              } />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>

  );
}
export default App;