<template>


<div class=" container mx-auto bg-gray-800 " id="wallet">

  <Navbar /> 



      <div id="jumbotron" class=" ">



        <div class="whitespace-sm"></div>


        <div class="subtitle color-primary has-text-centered" v-cloak>
          {{ errorMessage }}
        </div>

      </div>



      <section class="hero  bg-gray-400 flex px-4 text-black"  >

         <div class="token-titlebar flex p-2" v-if="selectedActionAsset">
                

                <div class="token-icon  "> <img  v-bind:src="selectedActionAsset.imgurl" height="24" width="24"  ></img> </div>
                <div class="token-title px-4 "> {{ selectedActionAsset.name }} </div>
          </div>

          <div class="flex-grow"></div>
          <div class="inline-block">
            <div v-if="connectedToWeb3() == false" @click="connectToWeb3" class="button bg-green-500 hover:bg-green-700 text-white font-bold my-2 py-2 px-4 rounded cursor-pointer">Connect to Web3</div>

            <div v-if="connectedToWeb3() "   class="truncate  text-gray-800 p-2" style="max-width:250px;  ">

            <Web3NetButton
              v-bind:web3Plug="web3Plug"
            />

              <span class="  " style="max-width:120px">
              <a   v-bind:href="getEtherscanBaseURL()+'/address/'+activeAccountAddress" class="text-gray-800  "   target="_blank">  {{activeAccountAddress}} </a>
            </span>
            </div>
          </div>


       </section>


      <section class="hero   "  v-if="connectedToWeb3()==true">
        <div class="hero-body">
            


                  <PacketList 
                  title="Meta Packets"
                  v-bind:packetsArray="userPacketsArray"

                  />




        </div>
      </section>


  <Footer /> 

  </div>




 </template>

<script >
 
import Web3Plug from '../js/web3Plug.js'
 
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import Web3NetButton from './components/Web3NetButton.vue'
import PacketList from './components/PacketList.vue'
 

import { io } from "socket.io-client";

 var socket;
 var packetReadTimer;


export default {
  name: 'Home',
  components: {Navbar, Footer,Web3NetButton,PacketList},
  data() {
    return {
		selectedActionAsset: null,
	 
		errorMessage:null,
    web3Plug: null,
    networkName: null,

    userPacketsArray: [] 

    }
  },
  created(){

         let hostname = window.location.hostname
        let socketUrl = "ws://"+hostname+":8443"

          socket = io.connect(socketUrl, {reconnect: true});
 
 

      socket.on("connection", (socket) => {
        console.log(socket.handshake.query); // prints { x: "42", EIO: "4", transport: "polling" }
       });

       socket.on("recentPacketHistory" , (data) => {
          console.log('got recent packet history', data)

          this.userPacketsArray = data.packetsArray
       });

        packetReadTimer = setInterval(this.updatePacketsArray.bind(this),5000)
     
  },
  beforeDestroy(){

    clearInterval(packetReadTimer)

  },


  metaInfo() {
        return { 
            title: "Meta Relay",
            meta: [
                { name: 'description', content:  'Meta Tx Relay'},
                { property: 'og:title', content: "Meta Tx Relay"} 
           
            ]
        }
    },


  methods: {

    connectToWeb3(){
       this.web3Plug = new Web3Plug()

          this.web3Plug.getPlugEventEmitter().on('stateChanged', function(connectionState) {
                console.log('stateChanged',connectionState);

                // CUSTOM CODE HERE
                this.activeAccountAddress = connectionState.activeAccountAddress
                this.activeNetworkId = connectionState.activeNetworkId
                // END CUSTOM CODE

              }.bind(this));

          this.web3Plug.getPlugEventEmitter().on('error', function(errormessage) {
                console.error('error',errormessage);

                //CUSTOM CODE HERE
                this.web3error = errormessage
                // END CUSTOM CODE
              }.bind(this));


          this.web3Plug.connectWeb3( )


          this.networkName = this.web3Plug.getWeb3NetworkName(this.activeNetworkId)

 
          console.log('networkName', this.networkName )

          
           this.updatePacketsArray()

    },

    connectedToWeb3(){

      return (this.web3Plug != null && this.web3Plug.getConnectionState().activeNetworkId != null )
      
      },

       getEtherscanBaseURL(){

        let providerNetworkID = this.web3Plug.getConnectionState().activeNetworkId

        if( providerNetworkID == 42){
          return  'https://kovan.etherscan.io'
        }

        return 'https://etherscan.io'
    },

    onSelectedAssetCallback(asset){
      console.log('onSelectedAssetCallback', asset )

      this.selectedActionAsset = asset
    },


    async updatePacketsArray(){
      if(!this.web3Plug){
         
        return
      }
      let accounts = await this.web3Plug.getConnectedAccounts()
      let publicAddress = accounts[0]
      console.log('update packets array for ',publicAddress)


      //use websockets to grab data from mongo 
      socket.emit('recentPacketHistory',{publicAddress:publicAddress})
    }


  }
}
</script>
