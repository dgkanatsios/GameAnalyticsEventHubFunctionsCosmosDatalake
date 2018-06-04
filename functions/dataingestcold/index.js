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


module.exports = function (context, myEventBatch) {
    const eventHubMessages = myEventBatch; //no JSON.Parse needed

    const blobService = azurestorage.createBlobService(process.env.WEBSITE_CONTENTAZUREFILECONNECTIONSTRING);

    helpers.sendDataToDataLakeStore(eventHubMessages).then(() => {
        return new Promise((resolve, reject) => {
            blobService.deleteBlobIfExists('eventbatches', context.binding.name, function (err, res) {
                if (err) reject(err);
                else resolve(res);
            });
        });
    }).then(() => {
        context.done();
    }).catch((err) => { return utilities.setErrorAndCloseContext(context, err, 500) });



};
