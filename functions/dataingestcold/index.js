"use strict";

const MsRest = require("../shared/external").MsRest;
const adlsManagement = require("../shared/external").adlsManagement;
const constants = require('../shared/constants');

const utilities = require("../shared/utilities");
const helpers = require("./datalakehelpers");
const azurestorage = require('../shared/external').azurestorage;

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

const blobService = azurestorage.createBlobService(process.env.WEBSITE_CONTENTAZUREFILECONNECTIONSTRING);

function deleteBlob(context){
    return new Promise((resolve, reject) => {
        blobService.deleteBlob('eventbatches', context.bindingData.name, function (err, result, response) {
            if (err) {
                context.log(err);
                reject(err);
            }
            else resolve(result);
        });
    });
}

module.exports = function (context, myEventBatch) {
    const eventHubMessages = myEventBatch; //no JSON.Parse needed

    helpers.sendDataToDataLakeStore(eventHubMessages).then(() => deleteBlob(context)).then(() => {
        context.done();
    }).catch((err) => { return utilities.setErrorAndCloseContext(context, err, 500) });

};
