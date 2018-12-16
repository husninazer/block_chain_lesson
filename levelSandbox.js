/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

const Promise = require('promise');

// Add data to levelDB with key/value pair
exports.addLevelDBData = function (key,value){

  return new Promise(function(resolve, reject) {
    db.put(key, value, function(err) {
      if (err) {
        console.log('Block ' + key + ' submission failed', err);
        reject(err)
      }
      else {
        console.log("Stored block: " + key)
        resolve(key)
      }
    })
  })
  
}

// Get data from levelDB with key
exports.getChainLength = function () {
  return new Promise(function(resolve, reject) {
    var chain = []
    var count = 0
    db.createReadStream()
    .on('data', function(data){
      //console.log(data.value)
      chain.push(JSON.parse(data.value))
      count++;
    })
    .on('error', function(err){
      reject(err)
    })
    .on('close', function() {
      count-- // Subtract GENESIS block
      resolve(count)
    })
  })
}

// Get single data
exports.getLevelDBData = function(key) {
  return new Promise(function(resolve, reject) {
    db.get(key, function(err, value) {
      if (err) reject(err);
      //console.log('Value = ' + value);
      resolve(value)
    })
  })
}

//Get Block by Hash
exports.getBlockByHash = function(hash) {
  let block = null;
  return new Promise(function(resolve, reject){
      db.createReadStream()
      .on('data', function (data) {
        let temp = JSON.parse(data.value)
          if(temp.hash === hash){
              block = temp;
          }
      })
      .on('error', function (err) {
          reject(err)
      })
      .on('close', function () {
          resolve(block);
      });
  });
}

//Get Block by Address
exports.getBlockByAddress = function(address) {
  let blocks = [];
  return new Promise(function(resolve, reject){
      db.createReadStream()
      .on('data', function (data) {
          let temp = JSON.parse(data.value)
          if(!!temp.body)
          if(temp.body.address === address){
              blocks.push(temp);
          }
      })
      .on('error', function (err) {
          reject(err)
      })
      .on('close', function () {
          resolve(blocks);
      });
  });
}




// Add data to levelDB with value
function addDataToLevelDB(value) {
    let i = 0;
    db.createReadStream().on('data', function(data) {
          i++;
        }).on('error', function(err) {
            return console.log('Unable to read data stream!', err)
        }).on('close', function() {
          console.log('Block #' + i);
          addLevelDBData(i, value);
        });
}

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/


// (function theLoop (i) {
//   setTimeout(function () {
//     addDataToLevelDB('Testing data');
//     if (--i) theLoop(i);
//   }, 100);
// })(10);
