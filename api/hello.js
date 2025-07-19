// /api/hello.js
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: "Supporter GPT API is alive!",
    timestamp: Date.now()
  });
}
