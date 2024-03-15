const { marshall } = require("@aws-sdk/util-dynamodb");
const auth = require("../middlewares/auth");
const db = require("../utils/db");
const { DeleteItemCommand } = require('@aws-sdk/client-dynamodb')

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
		const payload = await auth(event)
		// only admin can delete report settings
		const groups = payload["cognito:groups"];
		if (!groups.includes("Admin")) {
			throw new Error("Not allowed to delete report settings");
		}

		const { id } = event.pathParameters;
		const user = event.queryStringParameters.user || "";

		if (!user) {
			throw new Error("user is required");
		}

		const params = {
			TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
			Key: marshall({
				Id: id,
				userId: user,
			})
		};
		const deleteItemCommand = new DeleteItemCommand(params);
		await db.send(deleteItemCommand);
		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Report settings deleted" }),
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


module.exports = { handler }