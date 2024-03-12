const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const auth = require("../middlewares/auth");
const db = require("../utils/db");
const { UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

const handler = async (event) => {
  try {
    const payload = await auth(event);

    // only admin can edit complete report
    const groups = payload["cognito:groups"];
    if (!groups.includes("Admin")) {
      throw new Error("Not allowed to edit report settings");
    }

    const { userId = '', ...body } = JSON.parse(event.body);

		if (!userId) {
			throw new Error("userId is required");
		}

    const { id } = event.pathParameters;

    const updatedKeys = Object.keys(body);

    const UpdateExpression = updatedKeys
      .map((key) => `${key} = :${key}`)
      .join(", ");

    const attributeValues = Object.entries(body).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [`:${key}`]: value,
      };
    }, {});

    const params = {
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
      Key: marshall({
        Id: id,
        userId: userId,
      }),
      UpdateExpression: `set ${UpdateExpression}`,
      ReturnValues: "ALL_NEW",
      ExpressionAttributeValues: marshall(attributeValues),
    };

    const updateItemCommand = new UpdateItemCommand(params);

    const data = await db.send(updateItemCommand);

    // get updated item
    const Attributes = unmarshall(data.Attributes);

    console.log(Attributes);

    return {
      statusCode: 200,
      body: JSON.stringify(Attributes),
    };
  } catch (error) {
    let message = "Internal server error";
    if (error instanceof Error) {
      message = error.message;
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }
};

module.exports = { handler };
