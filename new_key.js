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

  async function main() {
    try {
      await regularClient.connect();
      try {
        await secureClient.connect();
        // start-insert
        try {
          console.log(medicalRecordsSchema)
          for (let i = 1; i <= 10; i++) {
            const writeResult = await secureClient
              .db(db)
              .collection(coll)
              .insertOne({
                name: (Math.random() + 1).toString(36).substring(7),
                ssn: 241014209,
                key: (Math.random() + 1).toString(36).substring(7),
                bloodType: "AB+",
                "key-id": "demo-data-key",
                medicalRecords: [{ weight: Math.floor(Math.random() * 300) + 60, bloodPressure: "120/80" }],
                insurance: {
                  policyNumber: Math.floor(Math.random() * 10000) + 1000,
                  provider: "MaestCare",
                },
              });
          }
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

  async function update() {
    try {
      await regularClient.connect();
      try {
        await secureClient.connect();
        // start-insert
        try {
          const writeResult = await secureClient
            .db(db)
            .collection(coll_unc)
            .updateOne(
              { _id: new mongodb.ObjectId("636cd8337d4b7c5009187846") },
              {$set: {
                name: (Math.random() + 1).toString(36).substring(7),
                ssn: 241014209,
                "key-id": "demo-data-key",
                key: (Math.random() + 1).toString(36).substring(7),
                medicalRecords: [{ weight: Math.floor(Math.random() * 300) + 60, bloodPressure: "120/80" }],
                insurance: {
                  policyNumber: Math.floor(Math.random() * 10000) + 1000,
                  provider: "MaestCare",
                },
              }}
            );
            console.log(writeResult);
        } catch (writeError) {
          console.error("writeError occurred:", writeError);
        }
        // end-find
      } finally {
        await secureClient.close();
      }
    } finally {
      await regularClient.close();
    }
  }
  update();
}
run();