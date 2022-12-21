// Perform some processing or logic based on the event type and payload
export default async function handler(req, res) {
  const eventType = req.headers["x-github-event"];
  const payload = req.body;

  console.log("webhook received", eventType, payload);
  res.status(200).json({ eventType, payload });
}
