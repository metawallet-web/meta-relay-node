 var mongo = require('mongodb');
 var mongoClient = require('mongodb').MongoClient;
var defaulturl = "mongodb://localhost:27017";
var dbo;
module.exports =  {



    async init( dbName , url )
    {

      var self = this;

      if(!url)
      {
        url = defaulturl
      }

      if(dbName == null)
      {
        console.log('WARNING: No ServerMode Specified')
        dbName = "outerspace"
      }

      var database = await new Promise(function(resolve, reject) {
            mongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
              if (err) throw err;
                dbo = db.db( dbName );

                //test
                //self.insertOne('stats',{'hashrate':1000})
                resolve(dbo)
            });
        });


    //  await this.createCollectionIndexes()

    },


    async createCollectionIndexes()
    {
        await this.createNonceIndexOnCollection('activePlayers')
        await this.createNonceIndexOnCollection('units')
        await this.createNonceIndexOnCollection('items')

    },

    async createNonceIndexOnCollection(collectionName)
    {
      dbo.collection(collectionName).createIndex( { "nonce": 1 }, { unique: true } )
    },


    async shutdown()
    {
      //mongoClient.disconnect()
    },


    async insertOne(collectionName,obj)
    {
    //  var myobj = { name: "Company Inc", address: "Highway 37" };
      return new Promise(function(resolve, reject) {
          dbo.collection(collectionName).insertOne(obj, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });

    },


    //returns the updated row in a threadsafe manner
  /*  async findOneAndUpdate(collectionName,query,newvalues)
    {

      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).findOneAndUpdate(query,setvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },*/



    async updateMany(collectionName,query,newvalues)
    {

      //this is clunky and not thread safe -- will overwrite all fields
      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).updateMany(query,setvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },

      //returns the original row instead of inserted id
   async findOneAndUpdate(collectionName,query,newvalues)
   {
     let options= {returnOriginal:true}//default
     var setvalues = { $set: newvalues }

     return new Promise(function(resolve, reject) {

       dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
          if (err) reject(err);
          resolve(res);
        });


     }.bind(this));

   },

     //returns the updated row
   async updateAndFindOne(collectionName,query,newvalues)
    {
      let options= {returnOriginal:false} //give us the new record not the original
      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      }.bind(this));

    },

    //useful to do 'unset' which is useful to clear out for partial filter indexes
    async updateCustomAndFindOne(collectionName,query, setvalues )
     {
       let options= {returnOriginal:false} //give us the new record not the original
     //  var setvalues = { $set: newvalues }

       return new Promise(function(resolve, reject) {

         dbo.collection(collectionName).findOneAndUpdate(query,setvalues,options,function(err, res) {
            if (err) reject(err);
            resolve(res);
          });


       }.bind(this));

     },



    async updateOne(collectionName,query,newvalues)
    {

      //this is clunky and not thread safe -- will overwrite all fields
      var setvalues = { $set: newvalues }

      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).updateOne(query,setvalues,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },

    async upsertOne(collectionName,query,newvalues)
    {


      var setvalues = { $set: newvalues }

      var existing = await this.findOne(collectionName,query)
      if(existing)
      {
        return await this.updateOne(collectionName,query,newvalues)
      }else {
        return await this.insertOne(collectionName,newvalues)
      }

    /*  return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).updateOne(query,setvalues,{upsert: true},function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });*/

    },

    async deleteOne(collectionName,obj)
    {
      return new Promise(function(resolve, reject) {
          dbo.collection(collectionName).deleteOne(obj, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });


    },

    async deleteMany(collectionName,query)
    {
      return new Promise(function(resolve, reject) {
          dbo.collection(collectionName).deleteMany(query, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });


    },

    async dropCollection(collectionName)
    {
      return new Promise(function(resolve, reject) {
          dbo.dropCollection(collectionName, function(err, res) {
            if (err) reject(err);
          //  console.log("1 inserted ",collectionName);
            resolve(res);
          });
      });


    },

    async findById(collectionName,id)
    {

      var o_id = new mongo.ObjectID( id );

      return this.findOne(collectionName, o_id)

    },


    async findOne(collectionName,query)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).findOne(query,function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },

    async findAll(collectionName,query,outputFields)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query, outputFields).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },

    async findAllSortedWithLimit(collectionName,query,sortBy,maxCount)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query).sort(sortBy).limit(maxCount).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },


    async findAllSorted(collectionName,query,sortBy)
    {
    //  var query = { address: "Park Lane 38" };
    //  var filter = { _id: 0, name: 1, address: 1 };
      return new Promise(function(resolve, reject) {

        dbo.collection(collectionName).find(query).sort(sortBy).toArray(function(err, res) {
           if (err) reject(err);
           resolve(res);
         });


      });

    },

     getMongoClient()
     {
       return mongoClient;
     },



}
