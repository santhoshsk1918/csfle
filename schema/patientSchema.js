const { MongoClient, Binary } = require("mongodb");
const { parse } = require("uuid");

const getSchema = async (db) => {
  var key1 = (await db
    .collection("__keyVault")
    .findOne({ keyAltNames: "dataKey" }))._id;

  console.log(key1)
  
  return schema = {
    bsonType: "object",
    encryptMetadata: {
      keyId: [key1],
    },
    properties: {
      insurance: {
        bsonType: "object",
        properties: {
          policyNumber: {
            encrypt: {
              bsonType: "int",
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
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
      key: {
        encrypt: {
          bsonType: "string",
          algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
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
};
module.exports = getSchema;
