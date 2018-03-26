const documentClient = require("../shared/external").documentdb.DocumentClient;
const config = require("../shared/config");

const client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

const databaseUrl = `dbs/${config.database.id}`;
const collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;


function getGameSessionDocument(gameSessionID, context) {
    return new Promise((resolve, reject) => {

        const querySpec = {
            'query': 'SELECT * FROM events WHERE (events.gameSessionID = @gameSessionID)',
            "parameters": [
                { "name": "@gameSessionID", "value": gameSessionID }
            ]
        };

        client.queryDocuments(collectionUrl, querySpec).toArray((err, results) => {
            if (err) reject(err)
            else {
                if (results.length === 0) resolve(JSON.stringify({}));
                else {
                    let returnObj = results[0];
                    for (let i = 1; i < results.length; i++) {
                        if (results[i].documenttype === 'metadata') {
                            returnObj.type = results[i].type;
                            returnObj.map = results[i].map;
                            returnObj.startDate = results[i].startDate;
                        }
                        else {
                            //get property keys
                            let keys = Object.keys(results[i]);
                            for (let userID of keys) {
                                if (!returnObj[userID]) {
                                    returnObj[userID] = {};
                                    returnObj[userID].wins = 0;
                                    returnObj[userID].losses = 0;
                                }

                                returnObj[userID].wins += results[i][userID].wins;
                                returnObj[userID].losses += results[i][userID].losses;
                            }
                        }
                    }
                    resolve(returnObj);
                }
            }
        });
    });
}


module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.gameSessionID || (req.body && req.body.gameSessionID)) {
        const gameSessionID = (req.query.gameSessionID || req.body.gameSessionID);
        getGameSessionDocument(gameSessionID, context).then(x => {
            context.log(x);
            context.res = {
                body: x
            };
            context.done();
        }).catch(err => {
            context.log(err);
            context.done();
        });
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
        context.done();
    }

};