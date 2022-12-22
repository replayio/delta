const { updateCheck } = require("../../lib/github");

export default async function handler(req, res) {
  const owner = "replayio";
  const repo = "devtools";
  const summary = "";
  const text = "";
  const headSha = "c412f1a4b953c940964e0913a3fefbcca6c25096";
  const title = "Tests are running";
  const status = "in_progress";
  const conclusion = "in_progress";
  try {
    const checkRes = await updateCheck(owner, repo, {
      headSha,
      title,
      summary,
      conclusion,
      status,
      text,
    });
    res.status(200).json(checkRes);
  } catch (e) {
    res.status(500).json(e);
  }
}
