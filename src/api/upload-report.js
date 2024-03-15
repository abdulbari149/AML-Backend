const { PutObjectCommand, } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const s3 = require("../utils/s3");
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

		const datetime = new Date();

		const key = `data/${userId}/${datetime.getFullYear()}/${datetime.getMonth()}/${datetime.getDate()}/${uuid()}@${Date.now()}.csv`

		const promises = body.files.map((file) => {
			const buffer = Buffer.from(file, "base64");
			const params = {
				Bucket: process.env.REPORT_BUCKET_NAME,
				Key: key,
				Body: buffer,
			};

			const command = new PutObjectCommand(params);
			return s3.send(command);
		});

		await Promise.allSettled(promises);

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
