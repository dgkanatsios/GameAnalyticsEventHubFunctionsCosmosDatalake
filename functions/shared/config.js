let config = {};

config.endpoint = process.env.COSMOSDB_ENDPOINT;
config.primaryKey = process.env.COSMOSDB_PRIMARY_KEY;

config.database = {
    "id": "data"
};

config.collection = {
    "id": "events"
};

config.adlAccountName = process.env.ADL_ACCOUNT;
config.clientId = process.env.CLIENTID;
config.secret = process.env.CLIENTSECRET;
config.domain = process.env.TENANT;
config.subscriptionId = process.env.SUBSCRIPTIONID;

module.exports = config;