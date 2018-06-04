require('dotenv').config();
const EventHubClient = require('azure-event-hubs').Client;
const uuidv4 = require('uuid/v4');
const request = require('request');
const client = EventHubClient.fromConnectionString(process.env.EVENT_HUBS_CONNECTION_STRING);
const clienthelpers = require("../client/clienthelpers");

//MODIFY THE BELOW VALUES TO YOUR LIKING
/////////////////////////////////////////////
const totalGames = 200;
const minMessagesPerGame = 100;
const maxMessagesPerGame = 150;
const minPlayersPerGame = 8;
const maxPlayersPerGame = 16;
const totalPlayersPerDay = 500;
/////////////////////////////////////////////


let games = [];
let players = [];

//create random players
for (let j = 0; j < totalPlayersPerDay; j++) {
    let playerID;
    do {
        playerID = 'player_' + clienthelpers.randomstring(5); //playerID is "player_RANDOM_STRING"
    } while (players.find(x => x.playerID === playerID));

    players.push({
        playerID: playerID,
        playerCountry: clienthelpers.getRandomCountry()
    });
}

for (let i = 0; i < totalGames; i++) {
    let gameSession = {
        gameSessionID: clienthelpers.getDate() + "_" + uuidv4(), //gameSessionID is "year-month-day_GUID"
        players: []
    }

    //number of players for this game
    const playersCount = clienthelpers.getRandomInt(minPlayersPerGame, maxPlayersPerGame);
    for (let j = 0; j < playersCount; j++) {
        let randomPlayer;
        do {
            randomPlayer = clienthelpers.getRandomElement(players);
        } //don't have the same player join the game twice
        while (gameSession.players.find(x => x.playerID === randomPlayer.playerID));
        gameSession.players.push(randomPlayer);
    }
    games.push(gameSession);
}


function registerGames() {
    return new Promise((resolve, reject) => {
        let promises = [];
        games.forEach(gameSession => {

            //set the date to the session so we can re-use it when we send events later
            gameSession.startDate = clienthelpers.getRandomGameStartTime()

            const gameDocument = {
                gameSessionID: gameSession.gameSessionID,
                type: "type" + clienthelpers.getRandomInt(1, 10), //random game type
                map: "map" + + clienthelpers.getRandomInt(1, 10), //random map
                players: gameSession.players,
                startDate: gameSession.startDate
            };
            promises.push(registerGame(gameDocument));
        });
        Promise.all(promises).then(() => resolve()).catch(err => reject(err));
    });
}

let totalGamesRegistered = 0;
function registerGame(gameDocument) {
    return new Promise((resolve, reject) => {
        request({
            url: process.env.REGISTERGAME_FUNCTION_URL,
            json: gameDocument,
            method: 'POST'
        }, function (err, response, body) {
            // this callback will only be called when the request succeeded or after maxAttempts or on error
            if (err) {
                //reject(err);
                console.log(`Not registered game because of ${err}`);
                resolve();
            } else if (response) {
                totalGamesRegistered++;
                console.log(`Registered game ${gameDocument.gameSessionID}`);
                resolve(`${JSON.stringify(gameDocument)}`);
            }
        });
    });
}

registerGames()
    .then(() => console.log("games registration OK"))
    .then(() => sendDataToEventHub())
    .then(() => console.log("Total games registered: " + totalGamesRegistered))
    .catch(err => console.log("Error: " + err));

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

                        //let's suppose that each game has a duration of 15'
                        const eventDateTime = new Date(gameSession.startDate);

                        eventDateTime.setMinutes(eventDateTime.getMinutes() + clienthelpers.getRandomInt(0, 14));
                        eventDateTime.setSeconds(eventDateTime.getSeconds() + clienthelpers.getRandomInt(0, 59));

                        const event = {
                            eventID: uuidv4() + "_" + gameSession.gameSessionID, //unique event ID is  //gameSessionID is "GUID_gameSessionID"
                            gameSessionID: gameSession.gameSessionID,
                            winnerID: winnerID,
                            loserID: loserID,
                            eventDate: eventDateTime
                        };
                        addSpecial(event); //adds a 'special' property that contains special value(s) for this win

                        //console.log(JSON.stringify(event));

                        //we should *NOT* define a partition key when we send an event to Event Hubs
                        //https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-programming-guide#partition-key
                        tx.send(event);
                    }
                    totalEvents += winCount;
                    console.log(`Sent ${winCount} events for gameSessionID:${gameSession.gameSessionID}, ${totalEvents} in total so far`);
                });
                console.log("Finished");
                resolve("Finished");
            });
    });
}

function addSpecial(event) {
    //add a couple of special properties
    if (clienthelpers.getRandomInt(1, 10) === 5) {
        event.special = 'Low Health';
    };

    if (clienthelpers.getRandomInt(1, 10) === 7) {
        if (!event.special || event.special === '')
            event.special = 'Defender win';
        else
            event.special += '_Defender win';
    };
}