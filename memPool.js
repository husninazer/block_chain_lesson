const bitcoinMessage = require('bitcoinjs-message')
const TimeoutRequestsWindowTime = 5*60*1000;

class Mempool {

    constructor() {
      this.mempool = []
      this.timeoutRequests = []
      this.mempoolValid = []
    }
  
    addRequestValidation(walletAddress) {

        let requestTimeStamp = new Date().getTime().toString().slice(0,-3)

        let object = {
            "walletAddress": walletAddress,
            "requestTimeStamp": requestTimeStamp,
            "message": walletAddress +":"+requestTimeStamp+":starRegistry",
            "validationWindow": TimeoutRequestsWindowTime/1000
        }

        if (!!this.mempool[walletAddress]) {
            object.validationWindow = this.getTimeDifference(this.mempool[walletAddress].requestTimeStamp)
            object.requestTimeStamp = this.mempool[walletAddress].requestTimeStamp
            object.message = this.mempool[walletAddress].message
        }

        else {
            //add to mempool.
            this.mempool[walletAddress] = object
            //Set Timeout
            this.setMemTimeOut(walletAddress)
        }


        return new Promise(function(resolve, reject) {
            resolve(object)
        })

    }

    setMemTimeOut(walletAddress) {
        let self = this
        setTimeout(function(){ 
           self.removeRequestValidation(walletAddress) 
       }, TimeoutRequestsWindowTime );
   }

    removeRequestValidation(walletAddress) {
        // add to timeout request
        this.timeoutRequests[walletAddress] = this.mempool[walletAddress]
        delete this.mempool[walletAddress];
    }
   
    //Remove from mempoolvalid after registering a star
    removeMempoolValid(walletAddress) {
        delete this.mempoolValid[walletAddress];
    }

    //Implements Validate
    validate(walletAddress, signature){
        let self = this;
        let object = self.mempool[walletAddress]
        

        return new Promise(async function(resolve, reject) {
            //check in this.mempool
            if (!object)  reject({err: "No Validation requests found"})

            // verify window time
            let timeLeft = self.getTimeDifference(object.requestTimeStamp)
            if(timeLeft < 0) reject({err:"Time Out"}) 
            object["validationWindow"] = timeLeft

            let isValid = await bitcoinMessage.verify(object.message, walletAddress, signature);
            if(!isValid)  reject({err:"Invalid Signature"})
            object["messageSignature"] = true

            let newObject = {
                registerStar : true,
                status: object,
            }

            // Add to mempool Valid
            self.mempoolValid[walletAddress] =  newObject

            resolve(newObject)
        })
    }

    getTimeDifference(requestTimeStamp) {
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - requestTimeStamp;
        return (TimeoutRequestsWindowTime/1000) - timeElapse;
    }
  }


  module.exports = Mempool