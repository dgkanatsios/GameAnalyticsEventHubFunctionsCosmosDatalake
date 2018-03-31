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

                const date = utilities.getDate(gameDocument.startDate);

                //'gameSessionID,gameType,gameMap,startDate'
                const data = `${gameDocument.gameSessionID},${gameDocument.type},${gameDocument.map},${gameDocument.startDate}\n`;

                const csvData = new Buffer(data);
                const options = {
                    appendMode: 'autocreate'
                };
                const filesystemClient = new adlsManagement.DataLakeStoreFileSystemClient(credentials);

                filesystemClient.fileSystem.concurrentAppend(accountName, `/${date}/metadata.csv`, csvData, options).then(()=>resolve("OK")).catch(err=>reject(err));
            });
    });
}

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    //get/create variables
    const gameDocument = {
        gameSessionID: req.body.gameSessionID,
        type: req.body.type,
        map: req.body.map,
        startDate: new Date(),
        documenttype: constants.metadata
    };

    insertDocumentToCosmos(gameDocument)
        .then(() => insertFileToADL(gameDocument))
        .then(() => context.done())
        .catch((err) => { context.log(err); context.done(); });

};