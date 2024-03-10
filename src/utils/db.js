const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const config = {
  region: 'eu-west-1',
}

if (process.env.IS_OFFLINE === 'true') {
  config.endpoint = 'http://0.0.0.0:8000';
}

const client = new DynamoDBClient(config);

module.exports = client;
