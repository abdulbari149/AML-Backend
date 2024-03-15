const db = require("../utils/db");
const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const auth = require("../middlewares/auth");

const headers =    {
  'Access-Control-Allow-Origin': '*', // or specific origin
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': true, // if using credentials
  'Access-Control-Max-Age': '86400', // 24 hours
  // Optionally, you can expose additional headers:
  // 'Access-Control-Expose-Headers': 'X-Custom-Header'
}

const handler = async (event) => {
  try {
    const payload = await auth(event);
    const userId = payload["cognito:username"];
    const groups = payload["cognito:groups"];
    const params = {
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
    };

    if (groups.includes("Banks") && !groups.includes("Admin")) {
      params.FilterExpression = "userId = :userId";
      params.ExpressionAttributeValues = {
        ":userId": { S: userId },
      };
    }

    const query = event.queryStringParameters;

    if (query?.user && typeof query?.user !== "undefined") {
      params.FilterExpression = "userId = :userId";
      params.ExpressionAttributeValues = {
        ":userId": { S: query.user },
      };
    }
    const command = new ScanCommand(params);

    const data = await db.send(command);

    const results = data.Items.map((item) => unmarshall(item));

    return {
      statusCode: 200,
      body: JSON.stringify(results),
      headers,
    };
  } catch (error) {
    let message = "Internal server error";
    if (error instanceof Error) {
      message = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
      headers,
    };
  }
};

module.exports = { handler };
