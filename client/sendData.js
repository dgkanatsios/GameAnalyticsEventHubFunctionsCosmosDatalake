require('dotenv').config();
const EventHubClient = require('azure-event-hubs').Client;
const uuidv4 = require('uuid/v4');
const request = require('request');
const client = EventHubClient.fromConnectionString(process.env.EVENT_HUBS_CONNECTION_STRING);
const clienthelpers = require("../client/clienthelpers");

const totalGames = 50;
const minMessagesPerGame = 5000;
const maxMessagesPerGame = 10000;

const minUserID = 1;
const maxUserID = 100;

let games = [];

for (let i = 0; i < totalGames; i++) {
    games.push(clienthelpers.getDate() + "_" + uuidv4());
}


function registerGames() {
    return new Promise((resolve, reject) => {
        let promises = [];
        games.forEach(gameSessionID => {
            const gameDocument = {
                gameSessionID: gameSessionID,
                type: "type1",
                map: "map1"
            };
            promises.push(registerGame(gameDocument));
        });
        Promise.all(promises).then(() => resolve()).catch(err => reject(err));
    });
}

function registerGame(gameDocument) {
    return new Promise((resolve, reject) => {
        request({
            url: process.env.REGISTERGAME_FUNCTION_URL,
            json: gameDocument,
            method: 'POST'
        }, function (err, response, body) {
            // this callback will only be called when the request succeeded or after maxAttempts or on error
            if (err) {
                reject(err);
            } else if (response) {
                console.log(`Registered game ${JSON.stringify(gameDocument)}`);
                resolve(`${JSON.stringify(gameDocument)}`);
            }
        });
    });
}

registerGames().then(() => console.log("registration OK")).then(() => sendDataToEventHub()).catch(err => console.log(err));

function sendDataToEventHub() {
    return new Promise((resolve, reject) => {
        let totalEvents = 0;
        client.open()
            .then(function () {
                return client.createSender();
            })
            .then(function (tx) {

                tx.on('errorReceived', function (err) { console.log(err); reject(err); });

                games.forEach(gameSessionID => {
                    const winCount = clienthelpers.getRandomInt(minMessagesPerGame, maxMessagesPerGame);
                    for (let j = 0; j < winCount; j++) {

                        let winnerID = 'user' + clienthelpers.getRandomInt(minUserID, maxUserID);
                        let loserID;
                        do {
                            loserID = 'user' + clienthelpers.getRandomInt(minUserID, maxUserID);
                        } while (winnerID === loserID);

                        const event = {
                            gameSessionID: gameSessionID,
                            winnerID: winnerID,
                            loserID: loserID
                        }
                        //console.log(JSON.stringify(event));
                        totalEvents++;
                        //we should *NOT* define a partition key
                        //https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-programming-guide#partition-key
                        tx.send(event);
                    }
                    console.log(`Sent ${winCount} events for gameSessionID:${gameSessionID}, ${totalEvents} in total so far`);
                });
                console.log("Finished");
                resolve("Finished");
            });
    });
}