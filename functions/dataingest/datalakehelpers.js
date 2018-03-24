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
                    if (!messagesPerGameSession[message.gameSessionID]) {
                        messagesPerGameSession[message.gameSessionID] = [];
                    }
                    messagesPerGameSession[message.gameSessionID].push(message);
                });

                for (const gameSessionID in messagesPerGameSession) {

                    const specificMessagesPerGameSession = messagesPerGameSession[gameSessionID];

                    let data = '';
                    specificMessagesPerGameSession.forEach(message => {
                        data = `${data}\r\n${message.winnerID},${message.loserID}`;
                    });


                    promises.push(sendSingleFileToDataLakeStore(filesystemClient, data, gameSessionID));
                };

                Promise.all(promises).then(() => resolve("OK")).catch(err => reject(err));
            });
    });
}

function sendSingleFileToDataLakeStore(filesystemClient, data, gameSessionID) {
    return new Promise((resolve, reject) => {
        const datePath = gameSessionID.split('_')[0].split('-').join('/'); //https://stackoverflow.com/questions/1137436/what-are-useful-javascript-methods-that-extends-built-in-objects/1137579#1137579
        const csvdata = new Buffer(data);

        filesystemClient.fileSystem.append(accountName, `/${datePath}/${gameSessionID}.csv`, csvdata, function (err, result, request, response) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }

        });

    });
}



module.exports = {
    sendDataToDataLakeStore
};