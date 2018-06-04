"use strict";

const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;
const constants = require('../shared/constants');

const utilities = require("../shared/utilities");
const helpers = require("./datalakehelpers");

//event has the format
/*
const event = {
                    eventID: string
                    gameSessionID: string,
                    winnerID: string,    
                    loserID: string,
                    special: string, //optional
                    eventDate: new Date().toJSON()
                }
*/


module.exports = function (context, myEventBatch) {
    
    const eventHubMessages = JSON.parse(myEventBatch);

    let promises = [];

    promises.push(helpers.sendDataToDataLakeStore(eventHubMessages));

  

    Promise.all(promises).then(() => {
         
        context.done();
    })
    .catch((err) => { return utilities.setErrorAndCloseContext(context, err, 500) });
};
