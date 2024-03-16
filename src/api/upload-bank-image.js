const s3 = require('../utils/s3');
const auth = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const headers = {
  'Access-Control-Allow-Origin': '*', // or specific origin
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': true, // if using credentials
  'Access-Control-Max-Age': '86400', // 24 hours
}


const handler = async (event) => {
  try {
    const payload = await auth(event);
    if (!payload) {
      throw new Error('Unauthorized');
    }
    const body = JSON.parse(event.body);
    const { image } = body;
    const userId = payload['cognito:username']

    const contentType = image.split(';')[0].split('/')[1];

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const buffer = Buffer.from(base64Image, 'base64');

    const key = `profile/${userId}.${contentType}`;

    const command = new PutObjectCommand({
      Bucket: process.env.REPORT_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${contentType}`,
    })

    await s3.send(command);


    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image uploaded successfully' }),
      headers
    }

  } catch (error) {
    if (error.message === 'Unauthorized') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers,
      }
    }


    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message }),
      headers
    }
  }
}

module.exports = { handler }