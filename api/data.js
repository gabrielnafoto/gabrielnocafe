// api/data.js — Vercel Serverless Function (CommonJS)

const { getData, saveData } = require("../lib/store.js");
const { clean } = require("../public/render-shared.js");

// Runs clean() (strip stray double-spaces, leading/trailing space, and
// punctuation pushed off its word) over every string the admin saves, not
// just at render time — keeps the data itself tidy for anything that reads
// it directly (api/og.js, admin.html re-opening a field, /api/data
// consumers) instead of relying on every reader to normalise on the way out.
function deepClean(value) {
  if (typeof value === "string") return clean(value);
  if (Array.isArray(value)) return value.map(deepClean);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = deepClean(value[k]);
    return out;
  }
  return value;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const data = await getData();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const auth = (req.headers.authorization || "").replace("Bearer ", "").trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || auth !== adminPassword) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    // POST sem body = só teste de senha (usado no login do admin)
    if (!req.body) return res.status(200).json({ ok: true });

    try {
      const persisted = await saveData(deepClean(req.body));
      return res.status(200).json({ ok: true, persisted });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao salvar." });
    }
  }

  return res.status(405).json({ error: "Método não permitido." });
};
