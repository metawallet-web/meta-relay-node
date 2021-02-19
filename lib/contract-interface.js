const Tx = require('ethereumjs-tx')

const lavaContractJSON = require('../contracts/LavaWallet.json');
const tokenContractJSON = require('../contracts/_0xBitcoinToken.json');
const deployedContractInfo = require('../DeployedContractInfo.json');


module.exports = class ContractInterface  {


  //getLavaContract(web3,env).methods.signatureBurned('lalala').call()



  static getCustomContract(web3,abi,contractAddress)
  {
    return new web3.eth.Contract(abi,contractAddress)
  }
 

}
