const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config({ path: "./.env.local" });

function createJWT(pem) {
  const secondsFromEpoch = Math.round(Date.now() / 1000);

  return jwt.sign(
    {
      iss: 222164,
      iat: secondsFromEpoch - 60,
      exp: secondsFromEpoch + 10 * 60,
    },
    pem,
    { algorithm: "RS256" }
  );
}

async function createToken(installationId, jwt) {
  let res;
  try {
    res = await fetch(
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

    if (res.status !== 200) {
      console.log("res", res.status);
      const body = await res.text();
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

export default async function handler(_, res) {
  try {
    const jwt = createJWT(process.env.PEM);
    const tokenRes = await createToken(27623557, jwt);
    console.log("tokenRes", tokenRes);
    const { token } = JSON.parse(tokenRes);
    res.status(200).json({ token });
  } catch (e) {
    console.error("error", e);
    res.status(500).json({ error: e });
  }
}
