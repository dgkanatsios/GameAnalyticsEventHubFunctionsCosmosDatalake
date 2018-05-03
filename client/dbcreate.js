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
    "defaultTtl": 60 * 60, //total TTL seconds
    partitionKey: { paths: ["/gameSessionID"], kind: "Hash" }
};

const requestOptions = { offerThroughput: 2500 };

const client = new documentClient(endpoint, { "masterKey": primaryKey });

const databaseUrl = `dbs/${database.id}`;
const collectionUrl = `${databaseUrl}/colls/${collection.id}`;

function createCollection() {
    console.log(`Creating collection:\n${collection.id}\n`);
    return new Promise((resolve, reject) => {
        client.createCollection(databaseUrl, collection, requestOptions, (err, created) => {
            if (err) reject(err)
            else resolve("Create collection OK");
        });

    });
}

function createDatabase() {
    console.log(`Creating database:\n${database.id}\n`);
    return new Promise((resolve, reject) => {
        client.createDatabase(database, (err, created) => {
            if (err) reject(err)
            else resolve("Create DB OK");
        });
    });
}

createDatabase().then((res) => { console.log(res); return createCollection(); }).then((res) => console.log(res)).catch(err => console.log(err));

//createCollection().then(res=>console.log(res)).catch(err => console.log(err));