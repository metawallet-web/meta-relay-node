

const LavaPacketUtils = require('./lava-packet-utils')

 
module.exports= class RelayHelper{


    static async getRelayData(mongoInterface){



        return {}
    }


    static async getCompletedLavaPackets(mongoInterface){



        return {}
    }


    static async getQueuedLavaPackets(mongoInterface){



        return {}
    }


    static async storeNewLavaPacket(lavaPacket, chainId, mongoInterface){
        console.log('store new lava packet ', lavaPacket)

        let packetIsValid = RelayHelper.validateLavaPacket(chainId, lavaPacket  )

        if(packetIsValid){

            let newPacket = {

                input:{
                    method:lavaPacket.method,
                    relayAuthority:lavaPacket.relayAuthority,
                    from: lavaPacket.from,
                    to: lavaPacket.to,
                    walletAddress:lavaPacket.walletAddress,
                    tokenAddress:lavaPacket.tokenAddress,
                    tokenAmount:lavaPacket.tokenAmount,
                    relayerReward:lavaPacket.relayerReward,
                    expires:lavaPacket.expires,
                    nonce:lavaPacket.nonce,
                    signature:lavaPacket.signature
                },
                status: 'queued',
                type: 'lava',
                txdata: null,
                birthtime: Math.round(+new Date()/1000) 
                
            }

            await mongoInterface.insertOne('metapackets', newPacket )

            return {success:true }
        }

       
        return {success:false, message: 'Invalid Packet' }
  
    }


    static async storeNewPermitPacket(permitPacket, mongoInterface){
        console.log('store new permit ', permitPacket)

        let packetIsValid = RelayHelper.validatePermitPacket( permitPacket  )

        if(packetIsValid){

            

            let newPacket = {

                input:{
                    from: permitPacket.from,
                    to: permitPacket.to,
                    nonce: permitPacket.nonce,
                    expires: permitPacket.expires,
                    allowed: permitPacket.allowed,
                    v: permitPacket.v,
                    r: permitPacket.r,
                    s: permitPacket.s 
                },
                status: 'queued',
                type: 'permit',
                birthtime: Math.round(+new Date()/1000) 
                
            }

            await mongoInterface.insertOne('metapackets', newPacket )

            return {success:true }
        }

       
        return {success:false, message: 'Invalid Packet' }
    }

    //write unit test for this 
    static validateLavaPacket(chainId, lavaPacket ){

        //validate the signature offline  
        let valid = LavaPacketUtils.lavaPacketHasValidSignature(chainId, lavaPacket)

        return valid 
    }
    static validatePermitPacket( lavaPacket ){

        //validate the signature offline 

        return true 
    }


    static async setStatusOfLavaPacket(packet, newStatus, mongoInterface){
       return  await mongoInterface.updateAndFindOne('metapackets', {_id: packet._id}, { status: newStatus }  )
    }



}