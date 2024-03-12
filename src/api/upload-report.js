const { PutObjectCommand, } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const s3 = require("../utils/s3");
const auth = require("../middlewares/auth");

const handler = async (event, context, callback) => {
	try {
		const payload = await auth(event)
		const username = payload['preferred_username']
		const groups = payload['cognito:groups']

		if (!groups.includes('Banks')) {
			throw new Error('Only user can upload files')
		}

		const body = JSON.parse(event.body);
		body.files = body.files || [];

		const datetime = new Date();

		const key = `source/${username}/${datetime.getMonth() + 1}-${datetime.getFullYear()}/${uuid()}.csv`

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
		};
	} catch (error) {
		let message = 'Internal server error'
		if (error instanceof Error) {
			message = error.message
		}
		return {
			statusCode: 500,
			body: JSON.stringify({ message }),
		};
	}
};

module.exports = { handler };
