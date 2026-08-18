// api/data.js — Vercel Serverless Function
// GET  /api/data        → retorna conteúdo do site
// POST /api/data        → salva conteúdo (requer Authorization header)

import { DEFAULT_DATA } from "../lib/data.js";

// Vercel KV — disponível automaticamente quando você adiciona o KV Storage
// no painel do Vercel (Storage → KV → Connect)
let kv;
try {
  const kvModule = await import("@vercel/kv");
  kv = kvModule.kv;
} catch {
  kv = null; // fallback local
}

const SITE_KEY = "site_data";

async function getData() {
  if (kv) {
    const stored = await kv.get(SITE_KEY);
    return stored || DEFAULT_DATA;
  }
  return DEFAULT_DATA;
}

async function saveData(data) {
  if (kv) {
    await kv.set(SITE_KEY, data);
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  // CORS para o painel admin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const data = await getData();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    // Verificar senha via Authorization header: "Bearer SUA_SENHA"
    const auth = req.headers.authorization || "";
    const token = auth.replace("Bearer ", "").trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || token !== adminPassword) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    try {
      const newData = req.body;
      const saved = await saveData(newData);
      return res.status(200).json({ ok: true, persisted: saved });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao salvar." });
    }
  }

  return res.status(405).json({ error: "Método não permitido." });
}
