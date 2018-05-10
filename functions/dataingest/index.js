"use strict";

const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;
const constants = require('../shared/constants');
const documentClient = require("../shared/external").documentdb.DocumentClient;
const config = require("../shared/config");

const client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });
const databaseUrl = `dbs/${config.database.id}`;
const collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;
const utilities = require("../shared/utilities");
const helpers = require("./datalakehelpers");

function createDocument(document) {
    return new Promise((resolve, reject) => {

        document.documenttype = constants.message;
        //we should do a proper validation before saving
        client.createDocument(collectionUrl, document, (err, created) => {
            if (err) reject(err)
            else resolve(created);
        });
    });
};

//event has the format
/*
const event = {
                    eventID: string
                    gameSessionID: string,
                    winnerID: string,    
                    loserID: string,
                    special: string, //optional
                    eventDate: new Date().toJSON()
                }
*/

//aggregate game events to store data to Cosmos DB
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

    promises.push(helpers.sendDataToDataLakeStore(eventHubMessages));

    const aggregatedMessages = aggregateMessages(context, eventHubMessages);

    for (let i = 0; i < aggregatedMessages.length; i++) {
        promises.push(createDocument(aggregatedMessages[i]));
    }

    Promise.all(promises).then(() => context.done())
        .catch((err) => { return utilities.setErrorAndCloseContext(context, err, 500) });
};
