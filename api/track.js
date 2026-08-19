// api/track.js — click counter for "ver produto" links.
// POST is public and write-only (fire-and-forget from the visitor's browser,
// no auth, never blocks or errors visibly). GET is admin-only and returns
// every count, for the stats view in /admin.

const { trackClick, getClickCounts } = require("../lib/store.js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "POST") {
    const id = req.body && typeof req.body === "object" ? req.body.id : "";
    await trackClick(id);
    return res.status(204).end();
  }

  if (req.method === "GET") {
    const auth = (req.headers.authorization || "").replace("Bearer ", "").trim();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword || auth !== adminPassword) {
      return res.status(401).json({ error: "Não autorizado." });
    }
    const counts = await getClickCounts();
    return res.status(200).json(counts);
  }

  return res.status(405).json({ error: "Método não permitido." });
};
