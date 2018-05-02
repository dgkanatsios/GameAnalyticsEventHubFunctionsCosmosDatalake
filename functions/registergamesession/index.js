const documentClient = require("../shared/external").documentdb.DocumentClient;
const config = require("../shared/config");
const client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });
const databaseUrl = `dbs/${config.database.id}`;
const collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;
const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;
const utilities = require("../shared/utilities");
const accountName = config.adlAccountName;
const constants = require('../shared/constants');

function insertDocumentToCosmos(document) {
    return new Promise((resolve, reject) => {
        client.createDocument(collectionUrl, document, (err, created) => {
            if (err) reject(err)
            else resolve(created);
        });
    });
}

function insertFileToADL(gameDocument) {
    return new Promise((resolve, reject) => {
        MsRest.loginWithServicePrincipalSecret(
            config.clientId,
            config.secret,
            config.domain,
            (err, credentials) => {
                if (err) throw err;

                const datePath = gameDocument.gameSessionID.split('_')[0].split('-').join('/'); //https://stackoverflow.com/questions/1137436/what-are-useful-javascript-methods-that-extends-built-in-objects/1137579#1137579
                //'gameSessionID,gameType,gameMap,startDate'
                const data = `${gameDocument.gameSessionID},${gameDocument.type},${gameDocument.map},${gameDocument.startDate}\n`;

                const csvData = Buffer.from(data);

                const filesystemClient = new adlsManagement.DataLakeStoreFileSystemClient(credentials);

                //prepare player data
                let playerData = '';
                gameDocument.players.forEach(player => {
                    //'gameSessionID,playerID,playerCountry'
                    playerData += `${gameDocument.gameSessionID},${player.playerID},${player.playerCountry}\n`;
                });
                const csvPlayerData = Buffer.from(playerData);

                const playerDataPromise = appendLineToADLFile(filesystemClient, `/${datePath}/playerspergamesession.csv`, csvPlayerData);
                const gameSessionPromise = appendLineToADLFile(filesystemClient, `/${datePath}/gamesessions.csv`, csvData);

                Promise.all([gameSessionPromise, playerDataPromise]).then(() => resolve("OK")).catch(err => reject(err));

            });
    });
}

function appendLineToADLFile(filesystemClient, filename, data) {

    const options = {
        appendMode: 'autocreate',
        syncFlag: 'DATA'
    };

    return new Promise((resolve, reject) => {
        filesystemClient.fileSystem.concurrentAppend(accountName, filename, data, options)
            .then(() => resolve("OK"))
            .catch(err => reject(err));
    });
}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    //get/create variables
    const gameDocument = {
        gameSessionID: req.body.gameSessionID,
        type: req.body.type,
        map: req.body.map,
        startDate: req.body.startDate,
        documenttype: constants.metadata,
        players: req.body.players
    };

    insertDocumentToCosmos(gameDocument)
        .then(() => insertFileToADL(gameDocument))
        .then(() => context.done())
        .catch((err) => utilities.setErrorAndCloseContext(context, err, 500));

};