const { MongoClient } = require("mongodb");
const { ClientEncryption, KMSProviders } = require("mongodb-client-encryption");

async function execute() {
  const uri =
    "mongodb+srv://santhosh:santhosh@cluster1.j5z2f.mongodb.net/?retryWrites=true&w=majority";
  const keyVaultDatabase = "encryption";
  const keyVaultCollection = "__keyVault";

  const provider = "aws";
  const kmsProviders = {
    aws: {
      accessKeyId: "AKIASI6S44A47CK25WH6",
      secretAccessKey: "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",
    },
  };

  var db = "medicalRecords";
  var coll = "patients";
  var namespace = `${db}.${coll}`;

  const schema = {
    bsonType: "object",
    encryptMetadata: {
      keyId: "/key-id",
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
    mongocryptdBypassSpawn: true,
  };

  const masterKey = {
    key: "arn:aws:kms:ap-northeast-1:156671729721:key/4080b829-5799-4ccf-aa86-dd6d1c9dfe39",
    region: "ap-northeast-1",
  };

  const keyVaultNamespace = `${keyVaultDatabase}.${keyVaultCollection}`;
  const keyVaultClient = new MongoClient(uri);

  const encryption = new ClientEncryption(keyVaultClient, {
    keyVaultNamespace,
    kmsProviders,
  });

  const key = await encryption.createDataKey(provider, {
    masterKey: masterKey,
  });

  console.log("DataKeyId [base64]: ", key.toString("base64"));

  const secureClient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoEncryption: {
      keyVaultNamespace,
      kmsProviders,
      schemaMap: patientSchema,
      extraOptions: extraOptions,
    },
  });

  await secureClient.connect();
  const keyVaultDB = keyVaultClient.db(keyVaultDatabase);
  // Drop the Key Vault Collection in case you created this collection
  // in a previous run of this application.
  await keyVaultDB.dropDatabase();
  // Drop the database storing your encrypted fields as all
  // the DEKs encrypting those fields were deleted in the preceding line.
  await keyVaultClient.db("medicalRecords").dropDatabase();
  const keyVaultColl = keyVaultDB.collection(keyVaultCollection);
  await keyVaultColl.createIndex(
    { keyAltNames: 1 },
    {
      unique: true,
      partialFilterExpression: { keyAltNames: { $exists: true } },
    }
  );
}

execute();

// {
//     "Id": "key-consolepolicy-3",
//     "Version": "2012-10-17",
//     "Statement": [
//         {
//             "Sid": "Enable IAM User Permissions",
//             "Effect": "Allow",
//             "Principal": {
//                 "AWS": "arn:aws:iam::156671729721:root"
//             },
//             "Action": "kms:*",
//             "Resource": "*"
//         }
//     ]
// }

// KMS_TEST
// AKIASI6S44A47CK25WH6
// 7u9EfWMTYm5+xXDuiJ61TF8X28iKPv0gzIGzTfJu
