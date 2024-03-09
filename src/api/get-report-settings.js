const db = require('../utils/db');

const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const handler = async (event) => {

	try {
		const { userId } = event.pathParameters;
		const params = {
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME, // replace with your table name
			FilterExpression: "userId = :userId",
			ExpressionAttributeValues: {
				":userId": { S: userId },
			},
		};
		const results = [];
		do {
			const data = await db.send(new ScanCommand(params));
			data.Items.forEach((item) => results.push(unmarshall(item)));
			params.ExclusiveStartKey = data.LastEvaluatedKey;
		} while (typeof items.LastEvaluatedKey !== "undefined");

		return {
			statusCode: 200,
			body: JSON.stringify(results)
		}
	} catch (error) {
		response.statusCode = 500;
		response.body = JSON.stringify({ message: error.message });
	}

	return response;
}



module.exports = { handler }