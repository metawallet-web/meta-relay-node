



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


    static async storeNewLavaPacket(lavaPacket, mongoInterface){
        console.log('store new lava packet ', lavaPacket)

        let packetIsValid = RelayHelper.validateLavaPacket( lavaPacket  )

        if(packetIsValid){

            let newLavaPacket = {
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
            }

            await mongoInterface.insertOne('lavapackets', newLavaPacket )

            return {success:true }
        }

       
        return {success:false }
  
    }


    static async storeNewPermitPacket(permitPacket, mongoInterface){
        console.log('store new permit ', permitPacket)

        let packetIsValid = RelayHelper.validatePermitPacket( permitPacket  )

        if(packetIsValid){

            let newPermitPacket = {
                
                from: permitPacket.from,
                to: permitPacket.to,
                nonce: permitPacket.nonce,
                expires: permitPacket.expires,
                allowed: permitPacket.allowed,
                v: permitPacket.v,
                r: permitPacket.r,
                s: permitPacket.s 
             
            }

            await mongoInterface.insertOne('permitpackets', newPermitPacket )

            return {success:true }
        }

       
        return {success:false }
    }

    //write unit test for this 
    static validateLavaPacket( lavaPacket ){

        //validate the signature offline 

        return true 
    }
    static validatePermitPacket( lavaPacket ){

        //validate the signature offline 

        return true 
    }


}