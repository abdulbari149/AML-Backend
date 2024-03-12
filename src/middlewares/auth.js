const { DescribeKinesisStreamingDestinationCommand } = require("@aws-sdk/client-dynamodb");
const verifyToken = require("../utils/verifyToken");

const auth = async (event) => {
  const token = event.headers["Authorization"];
  const UnauthorizedError = new Error('Unauthorized')
  if (!token || token === "") {
    throw UnauthorizedError
  }



  const parts = token.split(" ");

  if (parts.length === 0) {
    throw UnauthorizedError
  }


  const [bearer, jwtToken] = parts;

  if (bearer !== "Bearer" || jwtToken === "") {
    throw UnauthorizedError
  }

  const promise = new Promise((resolve, reject) => {
    verifyToken(jwtToken, (err, decoded) => {
      if (err) {
        reject(err);
      }

      resolve(decoded);
    });
  });

  return await promise;
};

module.exports = auth;
