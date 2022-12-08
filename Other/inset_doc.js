
const mongodb = require("mongodb");
const { ClientEncryption } = require("mongodb-client-encryption");
const { MongoClient, Binary } = mongodb;


var db = "medicalRecords";
var coll = "patients";
var namespace = `${db}.${coll}`;
// start-kmsproviders
const provider = "aws";
const kmsProviders = {
  aws: {
    accessKeyId: "AKIASI6S44A47CK25WH6",
    secretAccessKey: "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",
  },
};
// end-kmsproviders

const connectionString = "mongodb+srv://santhosh:santhosh@cluster1.j5z2f.mongodb.net/?retryWrites=true&w=majority";

// start-key-vault
const keyVaultNamespace = "encryption.__keyVault";
// end-key-vault

// start-schema
const schema = {
  bsonType: "object",
  encryptMetadata: {
    keyId: "demo-data-key",
  },
  properties: {
    insurance: {
      bsonType: "object",
      properties: {
        policyNumber: {
          encrypt: {
            bsonType: "int",
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          },
        },
      },
    },
    medicalRecords: {
      encrypt: {
        bsonType: "array",
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },
    bloodType: {
      encrypt: {
        bsonType: "string",
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },
    ssn: {
      encrypt: {
        bsonType: "int",
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },
  },
};

var patientSchema = {};
patientSchema[namespace] = schema;
// end-schema

// start-extra-options
const extraOptions = {
  mongocryptdSpawnPath: "/Users/santhosh/Desktop/Work/EnterpriseInstalation/crypt/",
};
// end-extra-options

// start-client
const secureClient = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoEncryption: {
    keyVaultNamespace,
    kmsProviders,
    schemaMap: patientSchema,
    extraOptions: extraOptions,
  },
});
// end-client
const regularClient = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function main() {
  try {
    await regularClient.connect();
    try {
      await secureClient.connect();
      // start-insert
      try {
        const writeResult = await secureClient
          .db(db)
          .collection(coll)
          .insertOne({
            name: "Jon Doe",
            ssn: 241014209,
            bloodType: "AB+",
            "key-id": "demo-data-key",
            medicalRecords: [{ weight: 180, bloodPressure: "120/80" }],
            insurance: {
              policyNumber: 123142,
              provider: "MaestCare",
            },
          });
      } catch (writeError) {
        console.error("writeError occurred:", writeError);
      }
      // end-insert
      // start-find
      console.log("Finding a document with regular (non-encrypted) client.");
      console.log(
        await regularClient.db(db).collection(coll).findOne({ name: /Jon/ })
      );

      console.log(
        "Finding a document with encrypted client, searching on an encrypted field"
      );
      console.log(
        await secureClient.db(db).collection(coll).findOne({ name: /Jon/ })
      );
      // end-find
    } finally {
      await secureClient.close();
    }
  } finally {
    await regularClient.close();
  }
}
main();