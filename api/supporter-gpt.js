// /api/supporter-gpt.js
export default async function handler(req, res) {
  // Read the JSON body if it exists (optional sanity check)
  let body = {};
  if (req.method === "POST") {
    try {
      body = req.body ?? {};
    } catch (_) {}

    /* Quick guard: if no message, let the caller know. */
    if (!body.message) {
      return res.status(400).json({
        error: "Missing 'message' field in request body."
      });
    }
  }

  // Placeholder success response
  return res.status(200).json({
    ok: true,
    stub: "Supporter GPT endpoint is live ♡",
    echo: body
  });
}
