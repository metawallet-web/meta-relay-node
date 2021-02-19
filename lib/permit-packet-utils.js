
//var ethSigUtil = require('eth-sig-util')
const web3utils =  require('web3-utils');
const ethjsutil = require('ethereumjs-util')
var EIP712HelperV3 = require('../src/js/eip712/EIP712HelperV3');
const { TPagination } = require('vue-tailwind');


module.exports = class PermitPacketUtils  {

  static getContractPermitMethod(tokenContract, packetData  ){
    
    

    let VRS = PermitPacketUtils.signatureToVRS( packetData.signature  )

    return tokenContract.methods.permit( 
      packetData.from,
      packetData.to,
      packetData.nonce,
      packetData.expires,
      packetData.allowed,
      VRS.v,
      VRS.r,
      VRS.s
    );

  }


  static signatureToVRS(signature){
    if(signature.startsWith('0x')){
        signature = signature.substring(2);  
    }
   
    const r = "0x" + signature.substring(0, 64);
    const s = "0x" + signature.substring(64, 128);
    const v = parseInt(signature.substring(128, 130), 16); 

    return {v:v,r:r,s:s}

}



  static permitPacketHasValidSignature(_chainId, packetData){


     
    var sigHash = PermitPacketUtils.getPermitTypedDataHashFromPacket(_chainId, packetData);
    var hashBuf = ethjsutil.toBuffer(sigHash)

    var msgBuf = ethjsutil.toBuffer(packetData.signature)
    const res = ethjsutil.fromRpcSig(packetData.signature);


    const pubKey  = ethjsutil.ecrecover(hashBuf, res.v, res.r, res.s);
    const addrBuf = ethjsutil.pubToAddress(pubKey);
    const recoveredSignatureSigner    = ethjsutil.bufferToHex(addrBuf);

    //make sure the signer is the depositor of the tokens
    return (packetData.from.toLowerCase() == recoveredSignatureSigner.toLowerCase());

  }


  static getPermitTypedDataHashFromPacket(_chainId, packetData){

          var typedData = PermitPacketUtils.getPermitTypedDataFromParams(
          _chainId, 
          packetData.tokenName,
          packetData.tokenAddress,
          packetData.from,
          packetData.to,
          packetData.nonce,
          packetData.expires,
          packetData.allowed
          );

        const types = typedData.types;


        return PermitPacketUtils.getPermitTypedDataHash(typedData,types);


  }

 

  static getPermitTypedDataFromParams(
    _chainId, tokenName,  tokenAddress, from, to , nonce, expires, allowed )
  {
    const typedData = {
            types: {
                EIP712Domain: [
                  { name: 'name', type: 'string' },
                  { name: 'version', type: 'string' },
                  { name: 'chainId', type: 'uint256' },
                  { name: 'verifyingContract', type: 'address' }
                ],
                Permit: [
                  { name: 'holder', type: 'address' },
                  { name: 'spender', type: 'address' },
                  { name: 'nonce', type: 'uint256' },
                  { name: 'expiry', type: 'uint256' },
                  { name: 'allowed', type: 'bool' }
                ],
            },
            primaryType: 'Permit',
            domain: {
                name: tokenName,
                version: '1',
                chainId: _chainId,   
                verifyingContract: tokenAddress
            },
            message: {
               holder:from,
               spender: to,
               nonce:nonce,
               expiry:expires,
               allowed:allowed
            }
        };





      return typedData;
  
  }


  static getPermitTypedDataHash(typedData,types){
    console.log('got typeddata', typedData)

    var typedDataHash = web3utils.sha3(
        Buffer.concat([
            Buffer.from('1901', 'hex'),
            EIP712HelperV3.structHash('EIP712Domain', typedData.domain, typedData.types),
            EIP712HelperV3.structHash(typedData.primaryType, typedData.message, typedData.types),
        ]),
    );

     return typedDataHash;
  }

   



}
