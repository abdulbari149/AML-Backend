const verifyToken = require("../utils/verifyToken");

const auth = async (event) => {
  const token = event.headers["Authorization"];
  if (token === "") {
    throw new Error("Unauthorized");
  }

  const [baerer, jwtToken] = token.split(" ");
  if (baerer !== "Bearer" || jwtToken === "") {
    throw new Error("Unauthorized");
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
