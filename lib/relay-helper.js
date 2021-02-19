



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

        let packetIsValid = RelayHelper.validatePacket( lavaPacket  )

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


    static async storeNewPermitPacket(permitData, mongoInterface){
        console.log('store new permit ', permitData)


    }

    //write unit test for this 
    static validatePacket( lavaPacket ){

        //validate the signature offline 

        return true 
    }


}