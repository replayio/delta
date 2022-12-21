export default async function handler(req, res) {
  console.log("hello-event", req.query);
  res.status(200).json({ name: "John Doe" });
}
