/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
var levelServices = require("./levelSandbox")
const Promise = require('promise');

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii')

let Mempool = require('./memPool')
let mempool = new Mempool()

app.use( bodyParser.json() );   
const port = 8000



/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{

  constructor() {
    levelServices.getChainLength()
    .then(length => {
      this.chainLength = length
      //console.log(this.chainLength)
       //Check if genesis block exists
      if(this.chainLength < 0) {
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }
    }, err => {
      console.log(err)
    })
  }

  // Add new block
  async addBlock(newBlock){

    // Block height
    newBlock.height = (await this.getBlockHeight() + 1 )
    
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(this.chainLength>=0) { 
       let incomingBlock = await this.getBlock(this.chainLength) 
       newBlock.previousBlockHash = JSON.parse(incomingBlock).hash
       //console.log("INCOMING BLOKC", JSON.parse(incomingBlock).hash)
      }
            // Block hash with SHA256 using newBlock and converting to a string
       newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

        // Adding block object to chain
        //this.chain.push(newBlock);
        
        //Add Block to storage
        levelServices.addLevelDBData(newBlock.height, JSON.stringify(newBlock));

        //Increment Chain Length
        this.chainLength = this.chainLength + 1

        return new Promise(function(resolve, reject) {
          resolve(newBlock)
        })
  }

  // Get block height
    async getBlockHeight(){
      return (await levelServices.getChainLength())
    }

    // get block
    getBlock(blockHeight){
      // return object as a single string
      return new Promise(function(resolve, reject) {
        levelServices.getLevelDBData(blockHeight).then( value => {
          //console.log(value)
          resolve(JSON.parse(JSON.stringify(value)))
        }, err => {
          console.log(err)
          reject(err)
        });
      })
    }

    // validate block
    async validateBlock(blockHeight){
      // get block object
       return this.getBlock(blockHeight).then(value => {

         let block = JSON.parse(value)
              // get block hash
          let blockHash = block.hash;

          // remove block hash to test block integrity
          block.hash = '';
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          // Compare
          if (blockHash===validBlockHash) {
              return true;
            } else {
              console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
              return false;
            }
      });

    }

   // Validate blockchain
   async validateChain(){
      let errorLog = [];
      let chainHeight = (await this.getBlockHeight())
      console.log("CHAIN LENGTH ", chainHeight)
      for (let i = 0; i < chainHeight  ; i++) {
        // validate block
        if (await this.validateBlock(i) == false) errorLog.push(i);
        // compare blocks hash link

        let blockHash = (await this.getBlock(i)).hash
        let previousHash = (await this.getBlock(i+1)).previousBlockHash
        

        if (blockHash!==previousHash) {
          errorLog.push(i);
        }
      }

      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
    }
}





( function theLoop (i) {
  let blockchain = new Blockchain()
  
  setTimeout(async function() {
    blockchain.validateChain().then(data => {

    })
  }, 2000)
  
})(0);


let blockChain = new Blockchain()
app.get('/block/:height', async (req, res) => {
  let blockHeight = req.params.height
  await blockChain.getBlock(blockHeight).then(resolve => {
      res.json(JSON.parse(resolve))
  }, reject => {
    res.json({err: "Key does not exist"})
  })
  
})


app.post('/block', async (req, res) => {
  let body = req.body || '';
  if(body == "")  return res.json({err:"Empty Data"})

  //check if address valid
  let mempoolObject = mempool.mempoolValid[body.address] || ''
  if(mempoolObject === '')
  return res.json({err:"Address & Signature not validated"})


  // Check if user already registered a star
  let starsRegistered = await levelServices.getBlockByAddress(body.address)
  if(starsRegistered.length > 0) return res.json({err: "A Star already registered by this address"})

  //Check if star data, then encode story
  if (!!("star" in body))
  body.star.story = Buffer(body.star.story).toString('hex')


  let newBlock =  await blockChain.addBlock(new Block(body))
  newBlock.body.star.storyDecoded = hex2ascii(newBlock.body.star.story)

  //remove from mempoolValid array
  mempool.removeMempoolValid(body.address)

  res.json( newBlock)

})




//Route- requestValidation
app.post('/requestValidation', (req, res) => {
  let address = req.body.address
  if(!address) return res.send("Invalid Address")
  mempool.addRequestValidation(address).then(resolve => {
    res.json(resolve)
  }, reject =>{
    res.json(reject)
  })
})


//Route - validate
app.post('/message-signature/validate', (req, res) => {
  let address = req.body.address
  let signature = req.body.signature
  if(!address || ! signature) return res.send("Requires Address / Signature")
  mempool.validate(address, signature).then(resolve => {
    res.json(resolve)
  }, reject =>{
    res.json(reject)
  })
})


//Route - get star by hash / address
app.get('/stars/:property', (req, res) => {
  let string = String(req.params.property)

  let property= string.split(":")[0]
  let value = string.split(":")[1]
  

  if(property === "address") {
    levelServices.getBlockByAddress(value).then(resolve => {
      for(let i =0; i < resolve.length; i++) {
        if(!!resolve[i].body.star)
        resolve[i].body.star["storyDecoded"] = hex2ascii(resolve[i].body.star.story)
      }
      res.json(resolve)
    }) 
  }

  else if(property === "hash") {
    levelServices.getBlockByHash(value).then(resolve => {
      resolve.body.star.storyDecoded = hex2ascii(resolve.body.star.story)
      res.json(resolve)
    })
  }

})







app.listen(port, () => console.log(`Example app listening on port ${port}!`))