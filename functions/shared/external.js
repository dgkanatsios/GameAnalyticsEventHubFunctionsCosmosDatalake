const documentdb = require('documentdb');
const MsRest = require('ms-rest-azure');
const adlsManagement = require('azure-arm-datalake-store');
const uuid = require('uuid/v4');

module.exports = {
    documentdb,
    MsRest,
    adlsManagement,
    uuid 
}