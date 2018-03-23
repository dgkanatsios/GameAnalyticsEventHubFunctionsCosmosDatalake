"use strict";

const documentClient = require("documentdb").DocumentClient;

require('dotenv').config();
const endpoint = process.env.COSMOSDB_ENDPOINT;
const primaryKey = process.env.COSMOSDB_KEY;

const database = {
    "id": "data"
};

const collection = {
    "id": "events",
    "defaultTtl": 60 * 10, //seconds
    partitionKey: { paths: ["/gameSessionID"], kind: "Hash" } 
};

const requestOptions = { offerThroughput: 2500 };

var client = new documentClient(endpoint, { "masterKey": primaryKey });

var databaseUrl = `dbs/${database.id}`;
var collectionUrl = `${databaseUrl}/colls/${collection.id}`;

function createCollection() {
    console.log(`Creating collection:\n${collection.id}\n`);

    return new Promise((resolve, reject) => {

        client.createCollection(databaseUrl, collection, requestOptions, (err, created) => {
            if (err) reject(err)
            else resolve(created);
        });

    });
}

function createDatabase() {
    console.log(`Creating database:\n${config.database.id}\n`);
    return new Promise((resolve, reject) => {
                    client.createDatabase(config.database, (err, created) => {
                        if (err) reject(err)
                        else resolve(created);
                    });
    });
}

createCollection().then(() => console.log("OK")).catch(err => console.log(err));