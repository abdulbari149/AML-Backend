const db = require("../utils/db");

const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const handler = async (event) => {
  try {
    const { id } = event.pathParameters;
    const params = {
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME, // replace with your table name
      FilterExpression: "Id = :id",
      ExpressionAttributeValues: {
        ":id": { S: id },
      },
    };
    const results = [];
		let data;
    do {
      data = await db.send(new ScanCommand(params));
      data.Items.forEach((item) => results.push(unmarshall(item)));
      params.ExclusiveStartKey = data.LastEvaluatedKey;
    } while (typeof data.LastEvaluatedKey !== "undefined");

    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
		console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

module.exports = { handler };
