require('dotenv').config();
const EventHubClient = require('azure-event-hubs').Client;
const uuidv4 = require('uuid/v4');
const request = require('request');
const client = EventHubClient.fromConnectionString(process.env.EVENT_HUBS_CONNECTION_STRING);
const clienthelpers = require("../client/clienthelpers");

const totalGames = 1;

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
                resolve(`${JSON.stringify(gameDocument)}`);
            }
        });
    });
}

registerGames().then(() => console.log("registration OK")).then(() => sendDataToEventHub()).catch(err => console.log(err));

function sendDataToEventHub() {
    return new Promise((resolve, reject) => {
        client.open()
            .then(function () {
                return client.createSender();
            })
            .then(function (tx) {

                tx.on('errorReceived', function (err) { console.log(err); reject(err); });

                games.forEach(gameSessionID => {
                    const winCount = 5;//Math.floor(Math.random() * 50) + 50;     // returns a number between 50 and 100
                    for (let j = 0; j < winCount; j++) {

                        let winnerID = 'user' + Math.floor(Math.random() * 5) + 1;
                        let loserID;
                        do {
                            loserID = 'user' + Math.floor(Math.random() * 5) + 1;
                        } while (winnerID === loserID);

                        const event = {
                            gameSessionID: gameSessionID,
                            winnerID: winnerID,
                            loserID: loserID
                        }
                        console.log(JSON.stringify(event));
                        tx.send(event);
                    }
                    console.log(`Sent ${winCount} events for gameSessionID:${gameSessionID}`);
                });
                console.log("Finished");
                resolve("Finished");
            });
    });
}