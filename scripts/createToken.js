const { Octokit } = require("@octokit/rest");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });

// Read the private key from a file
const privateKey = process.env.PEM;

// Define the payload for the JWT
const payload = {
  iss: "Iv1.85c57147f19ba178", // Replace with your client ID
  iat: Date.now() / 1000,
  exp: Date.now() / 1000 + 60,
  sub: "octocat", // Replace with the user you want to authenticate as
};

// Sign the JWT using the private key
const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });

console.log(token);

// Create a new Octokit client
const octokit = new Octokit({
  auth: `bearer ${token}`,
});

(async () => {
  // Obtain an access token
  const result = await octokit.oauthAuthorizations.createAuthorization({
    scopes: ["public_repo"],
    client_id: "Iv1.85c57147f19ba178", // Replace with your client ID
    client_secret: "5be3786ac6a05a07ba37307ee4305496998ce40a", // Replace with your client secret
  });

  console.log(result.data.token);
})();
