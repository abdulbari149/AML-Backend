const db = require('../utils/db');
const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const auth = require('../middlewares/auth');


const handler = async (event) => {
	try {
		const payload = await auth(event);
		const userId = payload["cognito:username"];
		const groups = payload['cognito:groups'];
		const params = {
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
		}

		if (groups.includes('Banks') && !groups.includes('Admin')) {
			params.FilterExpression = "userId = :userId"
			params.ExpressionAttributeValues = {
				":userId": { S: userId },
			}
		}

		const query = event.queryStringParameters

		if (query?.user && typeof query?.user !== 'undefined') {
			params.FilterExpression = "userId = :userId"
			params.ExpressionAttributeValues = {
				":userId": { S: query.user },
			}
		}
		const command = new ScanCommand(params)

		const data = await db.send(command);

		const results = data.Items.map((item) => unmarshall(item));

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
}

module.exports = { handler }