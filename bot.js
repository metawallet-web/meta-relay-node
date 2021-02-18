




var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

 

var Web3 = require('web3')


const relayConfig = require('./config/relay.config.json')
const accountConfig = require('./config/account.config.json')

var mongoInterface = require('./lib/mongo-interface')

var apiServer = require('./lib/api-server')



init()

async function init(){
    console.log('Booting relay node.')

    await mongoInterface.init('metarelay')

    var web3 = new Web3()

    await apiServer.init(web3,mongoInterface)
}
