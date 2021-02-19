



 

var Web3 = require('web3')


var mongoInterface = require('./lib/mongo-interface')

var apiServer = require('./lib/api-server')
var LavaPacketSubmitter = require('./lib/lava-packet-submitter')

const relayConfig = require('./config/relay.config.json')
const accountConfig = require('./config/account.config.sample.json')


init()

async function init(){
    console.log('Booting relay node.')

   


    await mongoInterface.init('metarelay')

    let web3ProviderUrl = relayConfig.web3Provider

    let web3 = new Web3(web3ProviderUrl)

    let chainId = await web3.eth.getChainId( )

    console.log('Connected to Web3 chainId ',chainId)

    await apiServer.init(web3,chainId,mongoInterface)

    let lavaPacketSubmitter = new LavaPacketSubmitter(web3,chainId,mongoInterface )
 
}
