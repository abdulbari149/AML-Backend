const db = require('../utils/db');
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuid, v4 } = require('uuid');


const handler = async (event) => {
	const response = {
		statusCode: 200,
	}

	try {
		const body = JSON.parse(event.body);
		const params = {
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
			Item: marshall({
				Id: v4(),
				...body
			})
		};

		const command = new PutItemCommand(params);

		const createResult = await db.send(command);

		response.body = JSON.stringify({
			message: "Report settings created",
			...createResult
		});
	} catch (error) {
		response.statusCode = 500;
		response.body = JSON.stringify({ message: error.message });
	}

	return response;
}

module.exports = { handler }