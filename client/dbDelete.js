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
    "defaultTtl": 60 * 10, //total TTL seconds
    partitionKey: { paths: ["/gameSessionID"], kind: "Hash" }
};


const requestOptions = { offerThroughput: 2500 };

const client = new documentClient(endpoint, { "masterKey": primaryKey });

const databaseUrl = `dbs/${database.id}`;
const collectionUrl = `${databaseUrl}/colls/${collection.id}`;


function deleteCollection() {
    return new Promise((resolve, reject) => {
        client.deleteCollection(collectionUrl, function (err, result, response) {
            if (err) reject(err);
            else resolve("OK");
        });
    });
}

function deleteDatabase() {
    return new Promise((resolve, reject) => {
        client.deleteDatabase(databaseUrl, function (err, result, response) {
            if (err) reject(err);
            else resolve("Delete DB OK");
        });
    });
}

deleteDatabase().then(res => console.log(res)).catch((err) => console.log(err));

