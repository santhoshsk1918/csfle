const mongodb = require("mongodb");
const { ClientEncryption } = require("mongodb-client-encryption");
const { MongoClient } = mongodb;
const patientSchema = require("./schema/patientSchema");

var db = "medicalRecords";
var coll = "patients";
var coll_unc = "patients_unenc"
var load_col = "loan"
var namespace = `${db}.${coll}`;
var namespace_unc = `${db}.${coll_unc}`;
// start-kmsproviders
const kmsProviders = {
  aws: {
    accessKeyId: "AKIASI6S44A47CK25WH6",
    secretAccessKey: "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",
  },
};
// end-kmsproviders

const connectionString = "mongodb+srv://santhosh:santhosh@newcluster.j5z2f.mongodb.net/?retryWrites=true&w=majority";

// start-key-vault
const keyVaultNamespace = "encryption.__keyVault";
// end-key-vault

// start-schema

var medicalRecordsSchema = {};
medicalRecordsSchema[namespace] = patientSchema;
medicalRecordsSchema[namespace_unc] = patientSchema;
// end-schema

// start-extra-options
const extraOptions = {
  mongocryptdSpawnPath: "/Users/santhosh/Desktop/Work/EnterpriseInstalation/mongodb-macos-x86_64-enterprise-5.0.13/bin/mongocryptd",
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
// end-client
const regularClient = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const watchCursorFullDocumentBeforeChange = regularClient.db(db).collection("cs").watch([], {fullDocumentBeforeChange: "whenAvailable", fullDocument: "updateLookup"});
watchCursorFullDocumentBeforeChange.on("change", (change) => {
    console.log(JSON.stringify(change));
})

