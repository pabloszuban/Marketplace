// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {

    // Variables
    address payable public immutable feeAccount; // the account that receives fees
    uint public immutable feePercent; // the fee percentage on sales 
    uint public itemCount; 

    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        address payable seller;
        bool sold;
    }

    // itemId -> Item
    mapping(uint => Item) public items;

    event Offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        address indexed seller
    );
    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );
    event Exchanged(
        uint itemId,
        address indexed nft,
        uint tokenId,
        address indexed seller,
        address indexed buyer
    );

    constructor(uint _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // Make item to offer on the marketplace
    // The idea is that when we make an item, we dont put a price on it becouse then the price will be set offchain
    function makeItem(IERC721 _nft, uint _tokenId) external nonReentrant {
        // increment itemCount
        itemCount ++;
        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        // add new item to items mapping
        items[itemCount] = Item (
            itemCount,
            _nft,
            _tokenId,
            payable(msg.sender),
            false
        );
        // emit Offered event
        emit Offered(
            itemCount,
            address(_nft),
            _tokenId,
            msg.sender
        );
    }
    // We start talking about the price when we purchase the item
    function purchaseItem(uint _itemId, uint _priceBackend) external payable nonReentrant {
        uint _totalPrice = getTotalPrice(_priceBackend);
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(!item.sold, "item already sold");
        // pay seller and feeAccount
        item.seller.transfer(_priceBackend);
        feeAccount.transfer(_totalPrice-_priceBackend);
        // update item to sold
        item.sold = true;
        // transfer nft to buyer. Antes el buyer esa el msg.sender
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        // emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            _priceBackend,
            item.seller,
            msg.sender// Antes era msg.sender
        );
    }

    function exchangeItem(uint _itemId, uint _itemIdToExchangeBackend) external nonReentrant {
        // We first transfer nft from contract to buyer, who is the msg.sender
        Item storage item = items[_itemId];
        Item storage itemToExchange = items[_itemIdToExchangeBackend];

        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(!item.sold, "item already sold");
        require(_itemIdToExchangeBackend > 0 && _itemIdToExchangeBackend <= itemCount, "item doesn't exist");
        require(!itemToExchange.sold, "item already sold");

        // We verify that the marketplace is the owner of both nfts

        require(item.nft.ownerOf(item.tokenId) == address(this), "marketplace is not the owner of the nft");

        require(itemToExchange.nft.ownerOf(itemToExchange.tokenId) == address(this), "marketplace is not the owner of the nft");
        
        // transfer nft to buyer. Antes el buyer esa el msg.sender
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        // transfer nft to seller
        itemToExchange.nft.transferFrom(address(this), items[_itemId].seller, itemToExchange.tokenId);


        // update item to sold
        item.sold = true;
        itemToExchange.sold = true;


        // emit Exchanged event
        emit Exchanged(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.seller,
            msg.sender
        );
        // Then we transfer nft from buyer to seller using the _itemIdToExchangeBackend
        
        // emit Exchanged event
        emit Exchanged(
            _itemIdToExchangeBackend,
            address(itemToExchange.nft),
            itemToExchange.tokenId,
            msg.sender,
            items[_itemId].seller
        );
    }


    function getTotalPrice(uint _priceBackend) view public returns(uint){
        return((_priceBackend*(100 + feePercent))/100);
    }
}