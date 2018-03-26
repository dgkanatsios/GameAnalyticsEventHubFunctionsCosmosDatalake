[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![unofficial Google Analytics for GitHub](https://gaforgithub.azurewebsites.net/api?repo=GameAnalyticsEventHubFunctionsCosmosDatalake)](https://github.com/dgkanatsios/gaforgithub)
![](https://img.shields.io/badge/status-alpha-orange.svg)

# GameAnalyticsEventHubFunctionsCosmosDatalake

A simple architecture to consume and process messages coming from video game clients (or servers) using the following Azure services:

- Event Hubs
- Functions
- Cosmos DB
- Data Lake Store
- Data Lake Analytics

Click here to deploy to Azure
<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fdgkanatsios%2FGameAnalyticsEventHubFunctionsCosmosDatalake%2Fmaster%2Fazuredeploy.json" target="_blank"><img src="http://azuredeploy.net/deploybutton.png"/></a>

## Scenario

The scenario is based on a hypothetical multiplayer online game. Gamers connect to multiple game servers and compete among themselves. Gamers can have a 'win' or a 'loss'. You can think of wins/losses

## Architecture

![Architecture](media/architecture.png)

## Terminology

- *Game session*: a single round of a multiplayer game
- *Wins*: a 'win' of a user versus another one. This could be a 'kill' in a First Person Shooter, a bypassing in a racing game, a goal in a soccer match
- *Losses*: the exact opposite of the win, depending on the game scenario
- *winnerID*: the user that accomplished the win
- *loserID*: the user that suffered the loss from *winnerID*

## Data flow

- Game server registers the game by calling the *registergamesession* Function. Each game has a sessionID which is formattted like *year-month-day_GUID*
- Game server sends messages to Event Hub using the format:
```javascript
const event = {
                    gameSessionID: string,
                    winnerID: string,    
                    loserID: string
                }
```
- Event Hub triggers the dataingest Function which receives the messages in batch. Messages are sent to Azure Data Lake Store without any processing (cold path) whereas they are aggregated and sent to Cosmos DB (hot path)
- Game server or client can call *statistics* Function passing the gameSessionID as argument and get game session related data
- External service can use Data Lake Analytics jobs to query data in Data Lake Store (there is a relevant .usql script on the *various* folder). The output of these jobs can be ingested into other services (via Data Factory) or be used directly from a visualization platform such as PowerBI.

## FAQ

#### Is this the best architecture / solution?
Of course not. It always depends on your requirements. For example, you could swap Event Hubs with Kafka, Functions with Stream Analytics, Data Lake Analytics with Databricks or HDInsight. This is *one* implementation of a data streaming and processing pipeline, it can certainly work well and scale, however you are encouraged to modify parts of this solution towards your objectives.

#### Are messages meant to be sent from the game client or server?
It depends. Clients can hack (especially on PC) the messages and send malicious data to your Event Hubs. You wouldn't want to have users cheat on their ranking, right? The best approach would be to have the game server send the important messages (e.g. user1 killed user2) whereas game clients can send less important messages, like behavioral ones (e.g. in an adventure game, user's response to the question was the second one or it took 2' for the user to solve this puzzle or reach the goal).

#### How can I modify the communication between Event Hubs and Azure Functions?
You should check the parameters listed [here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json#eventhub). Moreover, you are encouraged to read [here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-hubs#trigger---scaling) regading Functions' scaling when using the Event Hubs trigger. Finally, check [here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-best-practices) for performance best practices for Azure Functions.