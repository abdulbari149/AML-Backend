const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const COGNITO_POOL_ID = process.env.COGNITO_POOL_ID;
const COGNITO_REGION = process.env?.AWS_REGION || 'eu-west-1';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`;

const client = jwksClient({
  jwksUri: `${COGNITO_ISSUER}/.well-known/jwks.json`,
});

function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function verifyToken(token, callback) {
  jwt.verify(token, getKey, { issuer: COGNITO_ISSUER }, function(err, decoded) {
    if (err) {
      callback(err, null);
    } else {
      // Token is valid. You can access the decoded token claims.
      callback(null, decoded);
    }
  });
}

module.exports = verifyToken;

