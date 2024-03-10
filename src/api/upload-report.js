const { PutObjectCommand, } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const s3 = require("../utils/s3");

const handler = async (event, context, callback) => {
	try {
		const datetime = Date.now();
		const body = JSON.parse(event.body);
		body.files = body.files || [];

		const promises = body.files.map((file) => {
			const buffer = Buffer.from(file, "base64");
			const params = {
				Bucket: process.env.REPORT_BUCKET_NAME,
				Key: `source/${datetime}/${uuid()}.csv`,
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
		console.log({ error })
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Internal server error" }),
		};
	}
};

module.exports = { handler };
