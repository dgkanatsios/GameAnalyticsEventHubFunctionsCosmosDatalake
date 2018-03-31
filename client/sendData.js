require('dotenv').config();
const EventHubClient = require('azure-event-hubs').Client;
const uuidv4 = require('uuid/v4');
const request = require('request');
const client = EventHubClient.fromConnectionString(process.env.EVENT_HUBS_CONNECTION_STRING);
const clienthelpers = require("../client/clienthelpers");

const totalGames = 25;
const minMessagesPerGame = 50;
const maxMessagesPerGame = 100;

const minUserID = 1;
const maxUserID = 100;

const minPlayersPerGame = 8;
const maxPlayersPerGame = 16;

const totalPlayersPerDay = 100;

let games = [];
let players = [];

//create random players
for (let j = 0; j < totalPlayersPerDay; j++) {
    let playerID;
    do {
        playerID = 'player_' + clienthelpers.randomstring(5);
    } while (players.find(x => x.playerID === playerID));

    players.push({
        playerID: playerID,
        playerCountry: clienthelpers.getRandomCountry()
    });
}

for (let i = 0; i < totalGames; i++) {
    let gameSession = {
        gameSessionID: clienthelpers.getDate() + "_" + uuidv4(),
        players: []
    }

    //number of players for this game
    const playersCount = clienthelpers.getRandomInt(minPlayersPerGame, maxPlayersPerGame);
    for (let j = 0; j < playersCount; j++) {
        let randomPlayer;
        do {
            randomPlayer = clienthelpers.getRandomElement(players);
        }
        while (gameSession.players.find(x => x.playerID === randomPlayer.playerID));
        gameSession.players.push(randomPlayer);
    }
    games.push(gameSession);
}


function registerGames() {
    return new Promise((resolve, reject) => {
        let promises = [];
        games.forEach(gameSession => {
            const gameDocument = {
                gameSessionID: gameSession.gameSessionID,
                type: "type" + clienthelpers.getRandomInt(1, 10),
                map: "map" + + clienthelpers.getRandomInt(1, 10),
                players: gameSession.players,
                startDate: new Date()
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

registerGames().then(() => console.log("game registration OK")).then(() => sendDataToEventHub()).catch(err => console.log(err));

function sendDataToEventHub() {
    return new Promise((resolve, reject) => {
        let totalEvents = 0;
        client.open()
            .then(function () {
                return client.createSender();
            })
            .then(function (tx) {

                tx.on('errorReceived', function (err) { console.log(err); reject(err); });

                games.forEach(gameSession => {
                    const winCount = clienthelpers.getRandomInt(minMessagesPerGame, maxMessagesPerGame);
                    for (let j = 0; j < winCount; j++) {

                        let winnerID = clienthelpers.getRandomElement(gameSession.players).playerID;
                        let loserID;
                        do {
                            loserID = clienthelpers.getRandomElement(gameSession.players).playerID;
                        } while (winnerID === loserID);

                        const event = {
                            gameSessionID: gameSession.gameSessionID,
                            winnerID: winnerID,
                            loserID: loserID,
                            eventDate: new Date()
                        }

                        //send a 'Low health' special property
                        if (clienthelpers.getRandomInt(1, 10) === 5) {
                            event.special = 'Low Health'
                        };

                        //console.log(JSON.stringify(event));
                        totalEvents++;
                        //we should *NOT* define a partition key
                        //https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-programming-guide#partition-key
                        tx.send(event);
                    }
                    console.log(`Sent ${winCount} events for gameSessionID:${gameSession.gameSessionID}, ${totalEvents} in total so far`);
                });
                console.log("Finished");
                resolve("Finished");
            });
    });
}