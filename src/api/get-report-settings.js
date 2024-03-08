const db = require('../utils/db');

const { GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const handler = async (event) => {
	const response = {
		statusCode: 200,
	}

	try {
		const { id } = event.pathParameters;
		const params = {
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
			Key: marshall({ Id: id }),
		};

		const command = new GetItemCommand(params);
		const data = await db.send(command);
		response.body = JSON.stringify(unmarshall(data.Item));
	} catch (error) {
		response.statusCode = 500;
		response.body = JSON.stringify({ message: error.message });
	}

	return response;
}



module.exports = { handler }