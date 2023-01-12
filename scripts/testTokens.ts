import { fetchURI } from "../utils/fetchURI";

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });

function createJWT(appId, pem) {
  const secondsFromEpoch = Math.round(Date.now() / 1000);

  return jwt.sign(
    {
      iss: appId,
      // 10 * 60 sometimes responds with 401
      // {"message":"'Expiration time' claim ('exp') is too far in the future","documentation_url":"https://docs.github.com/rest"}
      exp: secondsFromEpoch + 9 * 60,
      iat: secondsFromEpoch - 60,
    },
    pem,
    { algorithm: "RS256" }
  );
}

async function createToken(installationId: number, jwt: string) {
  return await fetchURI(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + jwt,
        Accept: "application/vnd.github+json",
      },
      body: "",
    }
  );
}

// Follows the steps here:
// https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps
(async () => {
  const appId = 274973;
  const installationId = 32444723;
  const pem = process.env.PEM;

  const jwt = createJWT(appId, pem);
  const token = await createToken(installationId, jwt);
  console.log(token);
})();
