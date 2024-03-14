const db = require("../utils/db");
const { PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { v4: uuid, v4 } = require("uuid");
const auth = require("../middlewares/auth");

const handler = async (event) => {
  const response = {
    statusCode: 200,
  };
  try {
    const payload = await auth(event);
    const groups = payload["cognito:groups"];
    if (!groups.includes("Admin")) {
      throw new Error("Not allowed to create report settings");
    }

    const body = JSON.parse(event.body);
    const id = v4();
    const params = {
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
      Item: marshall({
        Id: id,
        ...body,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      }),
    };

    const command = new PutItemCommand(params);

    await db.send(command);

    const getCommand = new GetItemCommand({
      TableName: process.env.REPORT_SETTINGS_TABLE_NAME,
      Key: marshall({ Id: id, userId: body.userId }),
    });

    const output = await db.send(getCommand);

    response.body = JSON.stringify({
      message: "Report settings created",
      data: unmarshall(output.Item),
    });
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

  return response;
};

module.exports = { handler };
