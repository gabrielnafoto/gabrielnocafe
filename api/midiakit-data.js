// api/midiakit-data.js — Vercel Serverless Function (CommonJS)
// GET is public (used by api/midiakit.js at render time and for debugging).
// POST is protected by the same ADMIN_PASSWORD as api/data.js, and is called
// weekly by an automated job that refreshes Instagram Insights.

const { getMidiaKitData, saveMidiaKitData } = require("../lib/store.js");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const data = await getMidiaKitData();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const auth = (req.headers.authorization || "").replace("Bearer ", "").trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || auth !== adminPassword) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    if (!req.body) return res.status(400).json({ error: "Corpo vazio." });

    try {
      const payload = { ...req.body, updatedAt: new Date().toISOString() };
      const persisted = await saveMidiaKitData(payload);
      return res.status(200).json({ ok: true, persisted });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao salvar." });
    }
  }

  return res.status(405).json({ error: "Método não permitido." });
};
