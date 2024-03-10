const { S3Client, } = require("@aws-sdk/client-s3");

const config = {
	region: 'eu-west-1',
	s3ForcePathStyle: true,
}

if (process.env.IS_OFFLINE === 'true') {
	config.endpoint = 'http://0.0.0.0:4002';
	config.s3ForcePathStyle = true;
	config.credentials = {
		accessKeyId: "S3RVER",
		secretAccessKey: "S3RVER",
	}
}

const s3 = new S3Client(config);

module.exports = s3;