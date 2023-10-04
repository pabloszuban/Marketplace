import React from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";


const Navigation = ({ web3Handler, account }) => {
  return (
    <AppBar position="static" color="secondary" >
      <Container style={{ minWidth: '100%' }}>
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" style={{ textDecoration: "none", color: "white" }}>
            NFT Marketplace
          </Typography>
          <div style={{ flexGrow: 1 }} />
          <Button component={Link} to="/" color="inherit">
            Home
          </Button>
          <Button component={Link} to="/create" color="inherit">
            Create
          </Button>
          <Button component={Link} to="/my-listed-items" color="inherit">
            My Listed Items
          </Button>
          <Button component={Link} to="/my-bids" color="inherit">
            My bids
          </Button>
          <Button component={Link} to="/my-purchases" color="inherit">
            My Purchases
          </Button>
          <Button component={Link} to="/my-exchanges" color="inherit">
            My Exchanges
          </Button>
          {account ? (
            <Button
              href={`https://etherscan.io/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              color="inherit"
              style={{ marginLeft: "16px" }}
            >
              {account.slice(0, 5) + "..." + account.slice(38, 42)}
            </Button>
          ) : (
            <Button onClick={web3Handler} variant="outlined" color="inherit">
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
