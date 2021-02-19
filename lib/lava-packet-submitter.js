/*
  - when a packet looks 'good enough' to submit, it is submitted via web3 !
  - we only do this when it would make us a profit above the 'profit factor' in the config

*/

//const EthereumTx = require('ethereumjs-tx').Transaction

//const Tx = require('ethereumjs-tx')
const Web3Helper = require('./web3-helper')


const LavaWalletABI = require('../src/abi/LavaWallet.json')
const PermissibleTokenABI = require('../src/abi/PermissibleToken.json')

const relayConfig = require('../config/relay.config.json')
const accountConfig = require('../config/account.config.json')

const RelayHelper = require('./relay-helper')

var lavaPacketUtils = require("./lava-packet-utils");

var permitPacketUtils = require("./permit-packet-utils");

var web3utils =  require('web3-utils');

module.exports = class LavaPacketSubmitter  {

  constructor( web3, chainId, mongoInterface ) {
    this.web3=web3;
    this.chainId=chainId; 
     
    this.mongoInterface = mongoInterface;
 
     
   /* let contractDataForNetwork = Web3Helper.getContractDataForNetworkID( chainId ) // contractData.networks[networkName]
    console.log('contractDataForNetwork',contractDataForNetwork)
    this.lavaWalletAddress = contractDataForNetwork['LavaWallet'].address
    */
     
    this.init( )
  }


  //start tasks
  init() {
    
    setTimeout(this.pollLavaPacketsToSubmit.bind(this),0);

    setInterval(this.monitorPendingLavaPackets.bind(this),2000);
  }

  async pollLavaPacketsToSubmit()
  {
    console.log("poll packets to submit")
 


    //need a methods that gets # of pending packets
     var relayedPacketsData = await this.getPacketRelayStats();
     console.log('getPacketRelayStats',relayedPacketsData)



    //if a packet is not pending right now ....
    if(relayedPacketsData.pendingCount == 0 )
    {

      var queuedMetaPackets = await this.mongoInterface.findAll('metapackets', {status:'queued'} )

      console.log('packets',queuedMetaPackets) 
      //sort packets by attractiveness

      //lavaPackets, sort from highest score to lowest
    /*  queuedMetaPackets.sort(function(a, b) {
        return this.getLavaScore(b) - this.getLavaScore(a);
      });*/


      //submit the first one 
      if(queuedMetaPackets.length >= 1){

        let firstQueuedMetaPacket = queuedMetaPackets[0]

          //Try to submit to network and store tx data :D 
          var packetIsAttractive = await RelayHelper.packetIsAttractiveToSubmit(firstQueuedMetaPacket, this.mongoInterface);
    

            await this.processQueuedPacket( firstQueuedMetaPacket  )

         
         
       
        }

    }
 


    setTimeout(this.pollLavaPacketsToSubmit.bind(this),2*1000);
  }


   async processQueuedPacket(firstQueuedMetaPacket){

    if(firstQueuedMetaPacket.type == 'lava')
    {
      let lavaPacketInput = firstQueuedMetaPacket.input 


      console.log('trying to submit lava packet ', firstQueuedMetaPacket) 
    
      let relayingGasPrice = 2 
      
      let relayAccount = this.getRelayAccount()

      console.log('relayAccount' , relayAccount  )

      var submittal = await LavaPacketSubmitter.broadcastLavaPacket(
          lavaPacketInput,relayingGasPrice,relayAccount,this.web3);


        this.handleSubmittedTx(firstQueuedMetaPacket,  submittal  )
     

    }


    if(firstQueuedMetaPacket.type == 'permit')
    {
      let permitPacketInput = firstQueuedMetaPacket.input 


      console.log('trying to submit permit packet ', permitPacketInput) 
    
      let relayingGasPrice = 2 
      
      let relayAccount = this.getRelayAccount()

      console.log('relayAccount' , relayAccount  )


       let pendingUpdate =  await RelayHelper.setStatusOfPacket( firstQueuedMetaPacket, 'pending' , this.mongoInterface )
 

      var submittal = await LavaPacketSubmitter.broadcastPermitPacket(
        permitPacketInput,relayingGasPrice,relayAccount,this.web3);


        this.handleSubmittedTx(firstQueuedMetaPacket,   submittal  )

       /* console.log('txResult', txResult)

         

          let txdata = { txhash: txResult.txHash,  txtime: Math.round(+new Date()/1000)    }

          let result = await RelayHelper.appendTxDataToPacket( firstQueuedMetaPacket, txdata, this.mongoInterface )
      
          console.log('Appended tx data ', result )*/

         
 

    }




   }


   async handleSubmittedTx(packet, submittal){
    if(submittal.success ==true){
      let txResult = submittal.tx 


        let txdata = { txhash: txResult.txHash,  txtime: Math.round(+new Date()/1000)    }

        let result = await RelayHelper.appendTxDataToPacket( packet, txdata, this.mongoInterface )
    
        console.log('Appended tx data ', result )

        result =  await RelayHelper.setStatusOfPacket( packet, 'pending' , this.mongoInterface )

      }else{
        console.log('dropped packet for invalid gas estimate ' )
         await RelayHelper.setStatusOfPacket( packet, 'dropped' , this.mongoInterface )


      }

   }

  //monitor the blockchain ! 
  async monitorPendingLavaPackets()
  {
    console.log('monitor pending packets')

    var self = this;

    var relayedPacketsData = await this.getPacketRelayStats();
    console.log( relayedPacketsData ) 

    var currentEthBlock = await this.web3.eth.getBlockNumber( )
    // console.log( currentEthBlock,currentEthBlock  )

    let pendingPacket = await this.mongoInterface.findOne('metapackets', {status:'pending'} )

    //if a packet is not pending right now ....
    if( pendingPacket )
    {

      // lets see if that pending packet is mined.  
       
     
 
      let txData = pendingPacket.txdata 

      if( !txData ){
       
        let result =  await RelayHelper.setStatusOfPacket( pendingPacket, 'dropped' , this.mongoInterface )
        console.log('WARN: pending packet does not have txdata - dropping', result)

      }else{

        let txHash = txData.txhash

        if(txHash == null){
          console.error('Null tx hash')
          let result =  await RelayHelper.setStatusOfPacket( pendingPacket, 'dropped' , this.mongoInterface )
            
          return
        }

        // ask web3 for receipt 
        let receiptStatus = await LavaPacketSubmitter.getTransactionReceiptStatus(this.web3,txHash)

        console.log('receipt status is ', receiptStatus)

        if( receiptStatus.mined ){
          let result =  await RelayHelper.setStatusOfPacket( pendingPacket, 'mined' , this.mongoInterface )
       
        }else{

          //try to send the packet again ??

  

          let unix = Math.round(+new Date()/1000) 
          let ONE_MINUTE = 60

          if( txData.txtime < unix - ONE_MINUTE  ){
            let result =  await RelayHelper.setStatusOfPacket( pendingPacket, 'dropped' , this.mongoInterface )
            console.log('WARN: pending packet not mined in one hour - dropping', result)

          }
          

        }


      }

 

    }



   // setTimeout(this.monitorPendingLavaPackets.bind(this),10*1000);
  }


  static async getTransactionReceiptStatus(web3, txHash)
  {
      var liveTransactionReceipt = await this.requestTransactionReceipt(txHash, web3)


      var mined = (liveTransactionReceipt != null  )
      var success = false

      if( mined )
      {
          success =  ((liveTransactionReceipt.status == true)
                      || (web3utils.hexToNumber( liveTransactionReceipt.status) == 1 ))
     }

     return {mined:mined,success:success}
  }


  static async requestTransactionReceipt(txHash,web3)
  {
       var receipt = await web3.eth.getTransactionReceipt(txHash);

       return receipt;
  }

  //a score for how attractive a packet is to relay ...
  getLavaScore(lavaPacket)
  {
    return lavaPacket.relayerReward ;  //other factors ?
  }

  //is this working ??
  async getPacketRelayStats()
  {

    
    let minedTransactions = await this.mongoInterface.findAll('metapackets', {status:'mined'} )
    let pendingTransactions = await this.mongoInterface.findAll('metapackets', {status:'pending'} )
    let queuedTransactions = await this.mongoInterface.findAll('metapackets', {status:'queued'} )
 
    //number pending .. etc
    return {
      queuedCount: queuedTransactions.length,
      minedCount: minedTransactions.length,
      pendingCount: pendingTransactions.length
    }
  }

  /*
  async packetIsAttractiveToSubmit(packetData)
  {

    var relayData = await this.lavaPeer.getRelayData();

    var targetSafeLowRewardTokens =   (relayData.targetSafeLowRewardTokens) ;
    var targetNormalRewardTokens =   (relayData.targetNormalRewardTokens) ;
    var targetFastRewardTokens =   (relayData.targetFastRewardTokens) ;

    if(targetSafeLowRewardTokens <= 0 || targetNormalRewardTokens <= 0 || targetFastRewardTokens <= 0 )
    {
      console.error('Missing targetRewardTokens from getRelayData()')
      return {attractive:false,fast:false};
    }

    console.log('target safe low tokens', targetSafeLowRewardTokens)
    console.log('target fast tokens', targetFastRewardTokens)

            //use the decimals of the token .. not always 8!
    var targetSafeLowRewardSatoastis =  (targetSafeLowRewardTokens * (10**8) );
    var targetNormalRewardSatoastis =  (targetNormalRewardTokens * (10**8) );
    var targetFastRewardSatoastis =  (targetFastRewardTokens * (10**8) );
    // 0.0086
    console.log('target safe low satoastis', targetSafeLowRewardSatoastis)
    console.log('target fast satoastis', targetFastRewardSatoastis)

    console.log('relayer reward', parseInt(packetData.relayerReward))

    var relayRewardAboveSafeLow = ( parseInt(packetData.relayerReward) >= targetSafeLowRewardSatoastis )
    var relayRewardAboveNormal = ( parseInt(packetData.relayerReward) >= targetNormalRewardSatoastis )
    var relayRewardAboveFast = ( parseInt(packetData.relayerReward) >= targetFastRewardSatoastis )

    //dont use safe low

    return {attractive: relayRewardAboveNormal, fast: relayRewardAboveFast } ;

  }*/
 

  static async broadcastLavaPacket(packetData,relayingGasPrice,relayAccount,web3)
  {
    console.log('broadcast lava packet ', packetData  );


    var lavaContract = Web3Helper.getCustomContract(web3,LavaWalletABI, packetData.walletAddress);

    console.log(lavaContract.options.address) //undefined


    var addressFrom = relayAccount.publicAddress;
    var addressTo = lavaContract.options.address;

    var pKey =  relayAccount.privateKey;

    console.log('addressFrom ! ',addressFrom, addressTo)



    var txMethod = lavaPacketUtils.getContractLavaMethod(lavaContract,packetData)



    return await LavaPacketSubmitter.broadcastUsingTxMethod( web3, txMethod, relayingGasPrice, addressFrom, addressTo , pKey)   
   
  }

  static async broadcastPermitPacket(packetData,relayingGasPrice,relayAccount,web3)
  {
    console.log('broadcast permit packet ', packetData  );


    var tokenContract = Web3Helper.getCustomContract(web3,PermissibleTokenABI, packetData.tokenAddress);

    console.log(tokenContract.options.address) 


    var addressFrom = relayAccount.publicAddress;
    var addressTo = tokenContract.options.address;

    var pKey =  relayAccount.privateKey;

    console.log('addressFrom ! ',addressFrom, addressTo)



    var txMethod = permitPacketUtils.getContractPermitMethod(tokenContract,packetData)



    return await LavaPacketSubmitter.broadcastUsingTxMethod( web3, txMethod, relayingGasPrice, addressFrom, addressTo , pKey)   
   
  }
  
  
  static async broadcastUsingTxMethod(web3, txMethod, relayingGasPrice, addressFrom, addressTo, pKey){
    try{
      var txCount = await web3.eth.getTransactionCount(addressFrom);
      console.log('txCount',txCount)
     } catch(error) {  //here goes if someAsyncPromise() rejected}
      console.log('error',error);
       return error;    //this will result in a resolved promise.
     }


     var max_gas_cost = 704624;
     

     try{
       var estimatedGasCost = await txMethod.estimateGas({ from:addressFrom, to: addressTo });

      }catch(e){
        console.log("Gas estimate too high!  Something went wrong ")
        return  {success:false, error:'gas estimate too high'};
      }

     if( estimatedGasCost > max_gas_cost){


       console.log("Gas estimate too high!  Something went wrong ")
       return  {success:false, error:'gas estimate too high'};
     }
   

     console.log('estimated gas ', estimatedGasCost)

     

     console.log('broadcast w ', txMethod)

       let encoded_tx = txMethod.encodeABI();  //borked f or permit 


     //safelow ?
      console.log('relayingGasPrice ', relayingGasPrice)

        console.log('max_gas_cost ', max_gas_cost)

       console.log('txCount ', txCount)
        console.log('addressFrom ', addressFrom)
         console.log('addressTo ', addressTo)
    
    
    
         /*const txOptions = {
       nonce: web3utils.toHex(txCount),
       gas: web3utils.toHex(estimatedGasCost),
       gasPrice: web3utils.toHex(web3utils.toWei(relayingGasPrice.toString(), 'gwei') ),
       value: 0,
       to: addressTo,
       from: addressFrom //,
      // data: txData
    }*/


      let txOptions = {
          nonce: web3utils.toHex(txCount),
          gas: web3utils.toHex(max_gas_cost),
          gasPrice: web3utils.toHex(web3utils.toWei(relayingGasPrice.toString(), 'gwei') ),
          data: encoded_tx,
          value:0,
          from: addressFrom,
          to: addressTo
      };


      /*
      let transactionObject = {
          nonce: web3utils.toHex(txCount),
          gas: web3utils.toHex(max_gas_cost),
          gasPrice: web3utils.toHex(web3utils.toWei(relayingGasPrice.toString(), 'gwei') ),
        //  data: 'encoded_tx',
          value: 0,
          from: addressFrom,
          to: 0x0000000000000000000000000000000000000000
      };
      */

     

      console.log('SIGN WITH pkey',pKey)

   
       var tx = await this.sendSignedRawTransactionSimple(web3,txOptions,addressFrom,pKey)


       return  {success:true, tx:tx};
     
 
  }


  static async sendSignedRawTransactionSimple(web3,txOptions,addressFrom,pKey){

    let signedTx = await new Promise((resolve, reject) => {
      web3.eth.accounts.signTransaction(txOptions, pKey, function (error, signedTx) {
        if (error) {
        console.log(error);
        // handle error
           reject(error)
        } else {
            resolve(signedTx)
        }

      })
    });



      let submittedTx = await new Promise((resolve, reject) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (txHash) => {
              console.log('on tx hash: ', txHash)
              resolve({success:true, txHash: txHash})
            })

          /*  .on('confirmation', (confirmNumber,receipt) => {
              console.log('on tx confirmation: ', receipt)
              
            })
            .on('error', (error) => {
              console.log('on tx error: ', error)
              resolve({success:false, error: error})
            })

            .on('receipt', function (receipt) {
                  //do something
                  console.log('on tx receipt: ', receipt)
                  resolve({success:true, receipt: receipt})
          });*/
      })

        
        console.log('submittedTx',submittedTx)

          return submittedTx


  }
 

  getRelayAccount()
  {
    return accountConfig;
  }

}
