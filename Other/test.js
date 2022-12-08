'use strict';
const { MongoClient } = require('mongodb');
const { ClientEncryption } = require('mongodb-client-encryption');

const keyVaultDb = "csfle"; 
const keyVaultColl = "datakeys"; 
const keyAltName = "key1";

const keyVaultNamespace = `${keyVaultDb}.${keyVaultColl}`
const LOCAL_MASTER_KEY   =  'CgOcoan3c/wm2c+WsOO6fXOUlJgd7SLQ1vl///aEFX6vXN9+7VOAP+iHKheZiYlB09ZS7CDcAQhlPeTeQNz03xiGbiCJJvl3uj4lnG+5i/udSLJAcwgtgtaedkFD0ROq';
const kmsProviders = { local: { key: Buffer.from(LOCAL_MASTER_KEY, "base64") } };

const MDB_URL = "mongodb://santhosh:santhosh@cluster1-shard-00-00.j5z2f.mongodb.net:27017,cluster1-shard-00-01.j5z2f.mongodb.net:27017,cluster1-shard-00-02.j5z2f.mongodb.net:27017/?ssl=true&replicaSet=atlas-fphtmj-shard-0&authSource=admin&retryWrites=true&w=majority";
if (!MDB_URL){
  console.log("Please set MONGODB_URL environment variable");
} else {
  run().catch(err => console.log(err));  
}

async function run() {
  const unencryptedClient = new MongoClient(MDB_URL, {     
    useNewUrlParser: true,
    useUnifiedTopology: true 
  });
  try {
    await unencryptedClient.connect();
    const keycollection = unencryptedClient.db(keyVaultDb).collection(keyVaultColl); 
    let dataKeyId = await keycollection.findOne({'keyAltNames':keyAltName});
    if (dataKeyId === null) {
      console.log("Creating new data key ...");
      const clientEncryption = new ClientEncryption(unencryptedClient, { kmsProviders, keyVaultNamespace });
      dataKeyId = await clientEncryption
                      .createDataKey('local', {keyAltNames:[keyAltName]})
                      .catch((err) => { console.error(err.stack)});;
    } else {
      console.log("Found existing data key");
      dataKeyId = dataKeyId._id;
    }
    const dbName = keyVaultDb;
    const collName = 'test';

    const schemaMap = {
      [`${dbName}.${collName}`]: {
        bsonType:"object", 
        properties: {
          name:{
              bsonType:"string", 
              description:"A word of string"
          },
          encryptedField: {
            encrypt: {
              keyId : [dataKeyId], 
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
            }
          }
        }
      }
    };

    const encryptedClient = new MongoClient(MDB_URL, {
      useNewUrlParser: true,
      monitorCommands: true,
      useUnifiedTopology: true,
      autoEncryption: {
        keyVaultNamespace,
        kmsProviders,
        schemaMap
      }
    });

    try {
      console.log("\nOpening encrypted client connection...");
      await encryptedClient.connect();
      const collection = encryptedClient.db(dbName).collection(collName);

      console.log("\nAttempting to insert a document using transparent encryption...");
      const current_id = "123123"; 
      await collection.insertOne({"name":current_id, "encryptedField":"super secret"})
                      .catch((err) => { console.error(err.stack) });
      console.log("\nDocument inserted.");

      console.log("\nFetching encrypted document... \n");
      let doc = await collection.findOne()
                      .catch((err) => { console.error(err.stack) });
      console.log(doc);
    } finally {
      await encryptedClient.close();
      console.log("Finished");
    }
  } finally {
    await unencryptedClient.close();
  }
}