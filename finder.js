const mongodb = require("mongodb");
const { ClientEncryption } = require("mongodb-client-encryption");
const { MongoClient } = mongodb;
const patientSchema = require("./schema/patientSchema");

async function run() {
  var db = "medicalRecords";
  var coll = "patients";
  var coll_unc = "patients_unenc";
  var namespace = `${db}.${coll}`;
  var namespace_unc = `${db}.${coll_unc}`;
  // start-kmsproviders
  const kmsProviders = {
    aws: {
      accessKeyId: "",
      secretAccessKey: "",
    },
  };
  // end-kmsproviders

  const connectionString =
    "";
    

  // start-key-vault
  const keyVaultNamespace = "encryption.__keyVault";
  // end-key-vault

  // start-schema

  // end-client
  const regularClient = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  var medicalRecordsSchema = {};
  medicalRecordsSchema[namespace] = await patientSchema(
    regularClient.db("encryption")
  );
  medicalRecordsSchema[namespace_unc] = await patientSchema(
    regularClient.db("encryption")
  );
  // end-schema

  // start-extra-options
  const extraOptions = {
    mongocryptdSpawnPath:
      "/Users/santhosh/Desktop/Work/EnterpriseInstalation/6.0.mongodb-macos-x86_64-enterprise-6.0.2/bin/mongocryptd",
  };
  // end-extra-options

  // start-client
  const secureClient = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoEncryption: {
      keyVaultNamespace,
      kmsProviders,
      schemaMap: medicalRecordsSchema,
      extraOptions: extraOptions,
    },
  });

  async function rotate() {
    try {
      await regularClient.connect();
      try {
        await secureClient.connect();
        // start-insert
        console.log(
            await regularClient
              .db(db)
              .collection(coll_unc)
              .find().toArray()
          );
        // end-find
      } finally {
        await secureClient.close();
      }
    } finally {
      await regularClient.close();
    }
  }
  rotate();
}
run();