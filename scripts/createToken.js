const fetch = require("node-fetch");

async function getToken(path) {
  let res;

  try {
    res = await fetch(encodeURI(`http://localhost:3000/api/getToken`));

    // const json = await body.json();
    if (res.status !== 200) {
      const body = await res.text();
      console.log(res.status, body);
      return body;
    }
    const body = await res.json();
    return body;
  } catch (e) {
    console.error("error", e);
  }
}

(async () => {
  const res = await getToken();
  console.log(res);
})();
