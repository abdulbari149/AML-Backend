const { GetObjectCommand, ListObjectsCommand } = require("@aws-sdk/client-s3");
const auth = require("../middlewares/auth");
const s3 = require("../utils/s3");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Credentials": true,
};

function stream2buffer(stream) {
  return new Promise((resolve, reject) => {
    const _buf = [];
    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(err));
  });
}

const handler = async (event) => {
  try {
    const payload = await auth(event);
    const userId = payload["cognito:username"];

    const params = {
      Bucket: process.env.REPORT_BUCKET_NAME,
      Key: `profile/${userId}`,
    };
    const command = new ListObjectsCommand({
      Bucket: process.env.REPORT_BUCKET_NAME,
      Prefix: `profile/${userId}`,
    });

    const data = await s3.send(command);

    if (!data.Contents || data.Contents.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Image not found" }),
        headers,
      };
    }

    const getCommand = new GetObjectCommand({
      Bucket: process.env.REPORT_BUCKET_NAME,
      Key: data.Contents[0].Key,
    });

    const image = await s3.send(getCommand);
    const buffer = await stream2buffer(image.Body);
    const body = buffer.toString("base64");
    const contentType = image.ContentType.split("/")[1];
    const base64Image = `data:image/${contentType};base64,${body}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ image: base64Image }),
      headers,
    };
  } catch (error) {
    let message = "Internal server error";
    if (error.message) {
      message = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
      headers,
    };
  }
};

module.exports = { handler };
