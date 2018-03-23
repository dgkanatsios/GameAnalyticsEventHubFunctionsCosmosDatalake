require('dotenv').config();
const EventHubClient = require('azure-event-hubs').Client;
const uuidv4 = require('uuid/v4');

const client = EventHubClient.fromConnectionString('')

client.open()
    .then(function () {
        return client.createSender();
    })
    .then(function (tx) {

        tx.on('errorReceived', function (err) { console.log(err); });

        let games = [];

        for (let i = 0; i < 1; i++) {
            games.push(uuidv4());
        }

        games.forEach(gameSessionID => {
            const winCount = Math.floor(Math.random() * 50) + 50;     // returns a number between 50 and 100
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
        });
        console.log("Finished");


    });