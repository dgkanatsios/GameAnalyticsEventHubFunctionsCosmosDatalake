const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;
const config = require("../shared/config");
const accountName = config.adlAccountName;
const utilities = require("../shared/utilities");

function sendDataToDataLakeStore(eventHubMessages) {
    return new Promise((resolve, reject) => {
        MsRest.loginWithServicePrincipalSecret(
            config.clientId,
            config.secret,
            config.domain,
            (err, credentials) => {
                if (err) throw err;

                const filesystemClient = new adlsManagement.DataLakeStoreFileSystemClient(credentials);

                let promises = [];
                let messagesPerGameSession = {};

                //'split' messages per game session
                eventHubMessages.forEach(message => {
                    if (!message.special) message.special = ''; //add an empty special to avoid saving 'undefined'

                    if (!messagesPerGameSession[message.gameSessionID]) {
                        messagesPerGameSession[message.gameSessionID] = [];
                    }
                    messagesPerGameSession[message.gameSessionID].push(message);
                });

                for (const gameSessionID in messagesPerGameSession) {

                    const specificMessagesPerGameSession = messagesPerGameSession[gameSessionID];
                    let data = '';
                    specificMessagesPerGameSession.forEach(message => {
                        data += `${message.eventID},${message.gameSessionID},${message.winnerID},${message.loserID},${message.special},${message.eventDate}\n`;
                    });
                    promises.push(sendGameSessionEventsToDataLakeStore(filesystemClient, data, gameSessionID));
                };

                Promise.all(promises).then(() => resolve("OK")).catch(err => reject(err));
            });
    });
}

function sendGameSessionEventsToDataLakeStore(filesystemClient, data, gameSessionID) {
    return new Promise((resolve, reject) => {
        const datePath = gameSessionID.split('_')[0].split('-').join('/'); //https://stackoverflow.com/questions/1137436/what-are-useful-javascript-methods-that-extends-built-in-objects/1137579#1137579

        const csvdata = new Buffer(data);
        //https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.management.datalake.store.filesystemoperationsextensions.concurrentappendasync?view=azure-dotnet
        const options = {
            appendMode: 'autocreate',
            syncFlag: 'DATA'
        };

        filesystemClient.fileSystem.concurrentAppend(accountName, `/${datePath}/gameevents.csv`, csvdata, options)
            .then(() => resolve("OK")).catch(err => reject(err));
    });
}

module.exports = {
    sendDataToDataLakeStore
};