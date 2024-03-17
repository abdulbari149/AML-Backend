const { PutObjectCommand, } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const s3 = require("../utils/s3");
const auth = require("../middlewares/auth");
const headers = {
	'Access-Control-Allow-Origin': '*', // or specific origin
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Credentials': true, // if using credentials
	'Access-Control-Max-Age': '86400', // 24 hours
	// Optionally, you can expose additional headers:
	// 'Access-Control-Expose-Headers': 'X-Custom-Header'
}

const handler = async (event, context, callback) => {
	try {
		const payload = await auth(event)
		const username = payload['preferred_username']
		const userId = payload['cognito:username']
		const groups = payload['cognito:groups']

		if (!groups.includes('Banks')) {
			throw new Error('Only user can upload files')
		}

		const body = JSON.parse(event.body);
		body.files = body.files || [];

		if (body.files.length === 0) {
			throw new Error("No files to upload");
		}

		const datetime = new Date();

		const year = datetime.getFullYear();
		const month = (datetime.getMonth() + 1).toString().padStart(2, '0');
		const day = datetime.getDate().toString().padStart(2, '0');
		const hour = datetime.getHours().toString().padStart(2, '0');

		const promises = body.files.map((file) => {
			const fileName = `${file.tag}_${uuid()}_${Date.now()}.csv`
			const key = `data/${userId}/${year}/${month}/${day}/${hour}/${fileName}`

			const buffer = Buffer.from(file.uri, "base64");

			const params = {
				Bucket: process.env.REPORT_BUCKET_NAME,
				Key: key,
				Body: buffer,
			};

			const command = new PutObjectCommand(params);
			return s3.send(command);
		});

		const responses = await Promise.allSettled(promises);

		const errors = responses.filter((response) => response.status === "rejected");
		if (errors.length > 0) {
			const error = errors[0].reason;
			throw error;
		}



		return {
			statusCode: 200,
			body: JSON.stringify({ message: "Upload complete" }),
			headers,
		};
	} catch (error) {
		let message = 'Internal server error'
		if (error instanceof Error) {
			message = error.message
		}
		return {
			statusCode: 500,
			body: JSON.stringify({ message }),
			headers,
		};
	}
};

module.exports = { handler };
