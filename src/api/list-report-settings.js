const db = require('../utils/db');
const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");


const handler = async (event) => {
	try {

		const data = await db.send(new ScanCommand({
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
		}));

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