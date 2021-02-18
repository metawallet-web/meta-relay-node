




var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';

 

var Web3 = require('web3')


const relayConfig = require('./config/relay.config')
const accountConfig = require('./config/account.config')

var mongoInterface = require('./lib/mongo-interface')

var metaPeerInterface = require('./lib/meta-peer-interface')



init()

async function init(){
    console.log('Booting relay node.')

    await mongoInterface.init()

    var web3 = new Web3()

    await metaPeerInterface.init(web3)
}
