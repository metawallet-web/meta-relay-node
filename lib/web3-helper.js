

/*
    Web3Helper
  


*/

 

const Web3 = require('web3');
const web3utils = Web3.utils;
const BigNumber = Web3.utils.BN;

 
 
const chainIds = {
  '0x1':'mainnet',
  '0x2a':'kovan',
  '0x64':'xdai'

}

const contractData = require('../src/config/contract-data.json')


module.exports = class Web3Helper {

   
  static getCustomContract(web3,abi,contractAddress)
  {
    return new web3.eth.Contract(abi,contractAddress)
  }

   

  static getWeb3NetworkName(networkId){

    for(const [netId,netName] of Object.entries(chainIds)){
      if(networkId == netId){
        return netName
      }
    }


     console.error('Invalid network Id: ',networkId)
    return null
  }
 

  static getContractDataForNetworkID(networkId){
    let netName = Web3Helper.getWeb3NetworkName(networkId)

    if(netName){
        return contractData.networks[netName] 
    }

    return undefined
  }
 
 
  static rawAmountToFormatted(amount,decimals)
  {
    return (amount * Math.pow(10,-1 * decimals)).toFixed(decimals);
  }

  static formattedAmountToRaw(amountFormatted,decimals)
  {

    var multiplier = new BigNumber( 10 ).exponentiatedBy( decimals ) ;


    return multiplier.multipliedBy(amountFormatted).toFixed() ;
  }
 


}
