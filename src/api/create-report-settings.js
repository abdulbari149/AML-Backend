const db = require('../utils/db');
const { PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuid, v4 } = require('uuid');


const handler = async (event) => {
	const response = {
		statusCode: 200,
	}

	try {
		const body = JSON.parse(event.body);
		const id = v4()
		const params = {
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
			Item: marshall({
				Id: id,
				...body
			})
		};

		const command = new PutItemCommand(params);

		await db.send(command);

		const getCommand = new GetItemCommand({
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
			Key: marshall({ Id: id, userId: body.userId }),
		});

		const output = await db.send(getCommand);

		response.body = JSON.stringify({
			message: "Report settings created",
			data: output.Item,
		});
	} catch (error) {
		response.statusCode = 500;
		response.body = JSON.stringify({ message: error.message });
	}

	return response;
}

module.exports = { handler }