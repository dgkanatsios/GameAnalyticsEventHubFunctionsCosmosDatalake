const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;
const config = require("../shared/config");
const accountName = config.adlAccountName;

function sendDataToDataLakeStore(eventHubMessages) {
    return new Promise((resolve, reject) => {
        MsRest.loginWithServicePrincipalSecret(
            config.clientId,
            config.secret,
            config.domain,
            (err, credentials) => {
                if (err) throw err;

                const filesystemClient = new adlsManagement.DataLakeStoreFileSystemClient(credentials);

                const headers = 'winnerID,loserID';

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

                   
                    promises.push(sendSingleFileToDataLakeStore(filesystemClient, headers, data, gameSessionID));
                };

        Promise.all(promises).then(() => resolve("OK")).catch(err => reject(err));
    });
});
}

function sendSingleFileToDataLakeStore(filesystemClient, headers, data, gameSessionID) {
    return new Promise((resolve, reject) => {

        const date = getTodaysDate();

        const csvdata = new Buffer(data);

        const csvdataWithHeader = {
            streamContents: new Buffer(`${headers}${data}`)
        };


        filesystemClient.fileSystem.append(accountName, `/${date}/${gameSessionID}.txt`, csvdata, function (err, result, request, response) {
            if (err) {
                if (err.statusCode === 404) {
                    //file is not created so create it with a header row
                    filesystemClient.fileSystem.create(accountName, `/${date}/${gameSessionID}.txt`, csvdataWithHeader, function (err, result, request, response) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
                }
                else {
                    reject(err);
                }
            }
            else {
                resolve(result);
            }
        });

    });
}

function getTodaysDate() {
    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    return year + "/" + month + "/" + day;
}

module.exports = {
    sendDataToDataLakeStore
};