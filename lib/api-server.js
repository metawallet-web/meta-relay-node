const express = require('express')
const RelayHelper = require('./relay-helper')

var bodyParser = require("body-parser"); //listen for POST

    var fs = require('fs');

module.exports =  {



async init( web3, chainId,  mongoInterface ,https_enabled   )
{
    console.log("init web server...")

    this.chainId=chainId;
    this.web3=web3;
    this.mongoInterface=mongoInterface;


    var self = this;


    const app = express()

    if(https_enabled)
    {
      console.log('using https')

      var config = require('./sslconfig');

      var sslOptions ={
      key: fs.readFileSync(config.ssl.key),
      cert: fs.readFileSync(config.ssl.cert)/*,
      ca: [
        fs.readFileSync(config.ssl.root, 'utf8'),
        fs.readFileSync(config.ssl.chain, 'utf8')
      ]*/
     }



      var server = require('https').createServer(sslOptions,app);

    }else{
      var server = require('http').createServer(app);

    }



    app.use('/', express.static('public'))
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.all('/*', function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type,accept,access_token,X-Requested-With');
      next();
  });


  /*
  Lava Packet Data

    from: from,
    to: to,
    walletAddress:walletAddress,
    tokenAddress:tokenAddress,
    tokenAmount:tokenAmount,
    relayerReward:relayerReward,
    expires:expires,
    nonce:nonce,
    signature:signature

  */

    app.get('/stats',async function(request,response){
      //return stats about the relay
      var stats = await RelayHelper.getRelayData(mongoInterface)
      console.log('get stats',stats)

      response.send(JSON.stringify(stats));

    });



    app.get('/lavapackets',async function(request,response){
      //return stats about the relay
      var lavaPackets = await RelayHelper.getCompletedLavaPackets(mongoInterface)
      console.log('get lavaPackets',lavaPackets)

      response.send(JSON.stringify(lavaPackets));

    });

 

    app.post('/permitpacket',async function(request,response){

      console.log('received POST',request )
      console.log('received POST body ',  request.body)

      

      var permitData = Object.assign({},request.body)


      var result = await RelayHelper.storeNewPermitPacket(permitData, chainId, mongoInterface);
 
      if(result.success  )
      {
        console.log('stored new permit packet!')
        response.end(JSON.stringify({message:'success',success:true}));
      }else{
        console.error(result.message)
        response.end(JSON.stringify({message:result.message,success:false}));
      }

    })
 

    app.post('/lavapacket',async function(request,response){

       
      

      var lavaPacket = {
        method:request.body.method,
        relayAuthority:request.body.relayAuthority,
        from: request.body.from,
        to: request.body.to,
        walletAddress:request.body.walletAddress,
        tokenAddress:request.body.tokenAddress,
        tokenAmount:request.body.tokenAmount,
        relayerReward:request.body.relayerReward,
        expires:request.body.expires,
        nonce:request.body.nonce,
        signature:request.body.signature
      }
      console.log('got POST packet', lavaPacket  )

      var result = await RelayHelper.storeNewLavaPacket(lavaPacket, chainId, mongoInterface);



      if(result.success  )
      {
        response.end(JSON.stringify({message:'success',success:true}));
      }else{
        console.error('error',result.message)
        response.end(JSON.stringify({message:result.message,success:false}));
      }




    });

  /*  app.get('/profile/:address',function(req,res)
        {
            var address = null;

            if(req.params.address)
            {
              address = req.params.address;
            }

            res.sendFile('index.html', {root: './public/profile'});
        });*/





  /*  app.use('/profile/:address',

        express.static('public/profile')
      )*/

  //  app.use(express.static('public'))
  //  app.get('/', (req, res) => res.send('Hello World!'))
      
     let portNumber = 8620  //8620
    app.listen(portNumber, () => console.log(`Web app listening on port ${portNumber}!`))


      this.startSocketServer(server)
},



startSocketServer(server )
{


    //THIS IS CORRECT 
  let options={
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      
    }
  }
 

  var self = this;
  var io = require('socket.io')(server, options);
  var port = process.env.PORT || 8443;  //8443


  ///  https://socket.io/docs/rooms-and-namespaces/#


  server.listen(port, function () {
    console.log('Socket server listening at port %d', port);
  });

  var sockets = {};


  io.on('connection', function (socket) {
    console.log('established new socket connection');


        socket.on('ping', function (data) {
          console.log('ping', data);

            io.emit('pong', {
                message:'pong'
              });


           });




           socket.on('recentPacketHistory', async function (data) {

            let publicAddress = data.publicAddress 

            console.log('fetching recentPacketHistory', publicAddress  )
 

            var packetsArray = await RelayHelper.findRecentPacketsFromAddress(publicAddress, this.chainId, this.mongoInterface);
      
           
            socket.emit('recentPacketHistory',  {success:true, packetsArray: packetsArray });
            //socket.disconnect()

         }.bind(this));






          socket.on('permitPacket', async function (data) {

              let packet = data.packet 

              console.log('got Websocket data', data  )

                
              var permitData = Object.assign({}, packet )


              var result = await RelayHelper.storeNewPermitPacket(permitData, this.chainId, this.mongoInterface);
        
            

              socket.emit('permitPacket',  {success:true });
              socket.disconnect()

        }.bind(this));




        socket.on('lavaPacket', async function (data) {

          let packet = data.packet 

            console.log('got Websocket data', data  )

                var lavaPacket = {
                  method:packet.method,
                  relayAuthority:packet.relayAuthority,
                  from: packet.from,
                  to: packet.to,
                  walletAddress:packet.walletAddress,
                  tokenAddress:packet.tokenAddress,
                  tokenAmount:packet.tokenAmount,
                  relayerReward:packet.relayerReward,
                  expires:packet.expires,
                  nonce:packet.nonce,
                  signature:packet.signature
                }
                console.log('got Websocket packet', packet  )

                var result = await RelayHelper.storeNewLavaPacket(packet, this.chainId, this.mongoInterface);





             socket.emit('lavaPacket',  {success:true });

             socket.disconnect()

        }.bind(this));





        socket.on('getRelayData', async function (data) {

             var relayData = await self.lavaPeer.getRelayData()

             socket.emit('relayData',  relayData);

           });



         socket.on('getLavaPackets', async function (data) {

            var lavaPackets = await self.lavaPeer.getPacketCollector().getLavaPackets()

            socket.emit('lavaPackets',  lavaPackets);

          });

          socket.on('getQueuedTx', async function (data) {

             var lavaPackets = await self.lavaPeer.getPacketCollector().getQueuedLavaPackets()

             socket.emit('queuedTx',  lavaPackets);

           });

      //  saveMessage(data.chatRoomId, data.senderAddress, data.message);  //to database using sidekiq -> rails
    //});

    socket.on('disconnect', function () {
      console.log(socket.sid, 'disconnected');
      delete sockets[socket.sid];
    });
  }.bind(this));



}


 

}
