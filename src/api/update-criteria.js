const db = require('../utils/db')
const auth = require('../middlewares/auth')
const { UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const handler = async (event) => {
  try {
    const payload = await auth(event)
    const { id } = event.pathParameters
    const { body } = event
    const data = JSON.parse(body)

    const userId = payload['cognito:username']

    const groups = payload['cognito:groups']

    if (!groups.includes('Banks')) {
      throw new Error('Only user can updated criteria')
    }

    const getCommand = new GetItemCommand({
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
      Key: marshall({
        Id: id,
        userId
      })
    })

    const { Item } = await db.send(getCommand)

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Report settings with id ${id} not found` })
      }
    }


    const updateCommand = new UpdateItemCommand({
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
      Key: marshall({
        Id: id,
        userId
      }),
      UpdateExpression: 'SET criteria = :criteria, UpdatedAt = :UpdatedAt',
      ExpressionAttributeValues: marshall({
        ':criteria': data,
        ':UpdatedAt': new Date().toISOString()
      }),
      ReturnValues: 'ALL_NEW'
    })

    const { Attributes } = await db.send(updateCommand)
    const updatedCriteria = unmarshall(Attributes)
    return {
      statusCode: 200,
      body: JSON.stringify(updatedCriteria)
    }
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
}

module.exports = { handler };