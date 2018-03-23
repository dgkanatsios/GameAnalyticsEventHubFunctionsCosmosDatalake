"use strict";

const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;

const documentClient = require("../shared/external").documentdb.DocumentClient;
const config = require("../shared/config");

const client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });
const databaseUrl = `dbs/${config.database.id}`;
const collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;

const helpers = require("./datalakehelpers");

function insertDocument(document) {
    return new Promise((resolve, reject) => {
        client.createDocument(collectionUrl, document, (err, created) => {
            if (err) reject(err)
            else resolve(created);
        });
    });
};

//event has the format
/*
const event = {
                    gameSessionID: string,
                    winnerID: string,    
                    loserID: string
                }
*/


function aggregateMessages(context, eventHubMessages) {
    let aggregatedMessages = [];
    eventHubMessages.forEach(message => {
        //context.log(`Processing message ${JSON.stringify(message)}`);
        //check if gameSessionID already exists
        let foundGameSession = aggregatedMessages.find(x => x.gameSessionID === message.gameSessionID);

        if (!foundGameSession) {
            foundGameSession = {};
            foundGameSession.gameSessionID = message.gameSessionID;
            aggregatedMessages.push(foundGameSession);
        }


        //if the winner is not contained in the gameSessionID
        if (!foundGameSession[message.winnerID]) {
            foundGameSession[message.winnerID] = { wins: 0, losses: 0 };
        }
        foundGameSession[message.winnerID].wins++;

        if (!foundGameSession[message.loserID]) {
            foundGameSession[message.loserID] = { wins: 0, losses: 0 };
        }
        foundGameSession[message.loserID].losses++;
    });
    return aggregatedMessages;
}


module.exports = function (context, eventHubMessages) {
    //context.log(`JavaScript eventhub trigger function called for message array ${JSON.stringify(eventHubMessages)}`);

    let promises = [];
    const aggregatedMessages = aggregateMessages(context, eventHubMessages);

    for (let i = 0; i < aggregatedMessages.length; i++) {
        promises.push(insertDocument(aggregatedMessages[i]));
    }

    Promise.all(promises).then(() => {
        helpers.sendDataToDataLakeStore(eventHubMessages)
    }).then(() => context.done())
        .catch((err) => { context.log(err); context.done() });
};
