# Star notary registration using block chain

Blockchain has the potential to change the way that the world approaches data. Develop Blockchain skills by understanding the data model behind Blockchain by developing your own simplified private blockchain.

This project aims to build a block chain that lets users register and claim ownership of a any one star thats available.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to initialize your project and create package.json to store project dependencies.
```
cd project_2
npm install
node simpleChain.js
```

### Framework

The app uses (ExpressJS)[https://expressjs.com] as its framework.

## End points

### Get Block info
- #### URL
   http://localhost:8000/block/{height}

- #### Method
  GET

- #### Sample Call 
  GET http://localhost:8000/block/5

### Request for Validation
- #### URL
   http://localhost:8000/requestValidation
   
- #### Method
  POST

- #### Request Data
  Wallet address

```
  { "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL" }
  ```

- #### Sample Call 
  POST http://localhost:8000/requestValidation
  {
    address: "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL"
  }

### Validate
- #### URL
   http://localhost:8000/message-signature/validate
   
- #### Method
  POST

- #### Request Data
  Wallet address & Signature
  
  ```
  {
  "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
  "signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="
  }
  ```

- #### Sample Call 
  POST http://localhost:8000/message-signature/validate

  {
"address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
 "signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="
}

### Register Star for an address
- #### URL
   http://localhost:8000/block
   
- #### Method
  POST

- #### Data
  Wallet address with star data
  ```
  {
    "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
    "star": {
                "dec": "68° 52' 56.9",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/"
            }
  }
  ```

- #### Sample Call 
  POST http://localhost:8000/block

  {
    "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
    "star": {
                "dec": "68° 52' 56.9",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/"
            }
  }

### Star Lookup by Hash
- #### URL
   http://localhost:8000/stars/hash:[HASH]
   
- #### Method
  GET

- #### Data
  URL params - Hash

- #### Sample Call 
  GET http://localhost:8000/stars/hash:b7e0bb1553094f5bdbb57b2257ed025f5673a8eb3216273321b16694e6da1699

### Star Lookup by Address
- #### URL
   http://localhost:8000/stars/address:[ADDRESS]
   
- #### Method
  GET

- #### Data
  URL params - wallet address

- #### Sample Call 
  GET http://localhost:8000/stars/address:19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL




## Testing

To test code:
1: Open a command prompt or shell terminal after install node.js.
2: Enter a node session, also known as REPL (Read-Evaluate-Print-Loop).
```
node
```
3: Copy and paste your code into your node session
4: Instantiate blockchain with blockchain variable
```
let blockchain = new Blockchain();
```
5: Generate 10 blocks using a for loop
```
for (var i = 0; i <= 10; i++) {
  blockchain.addBlock(new Block("test data "+i));
}
```
6: Validate blockchain
```
blockchain.validateChain();
```
7: Induce errors by changing block data
```
let inducedErrorBlocks = [2,4,7];
for (var i = 0; i < inducedErrorBlocks.length; i++) {
  blockchain.chain[inducedErrorBlocks[i]].data='induced chain error';
}
```
8: Validate blockchain. The chain should now fail with blocks 2,4, and 7.
```
blockchain.validateChain();
```
