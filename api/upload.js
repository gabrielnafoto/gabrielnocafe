// api/upload.js — Vercel Serverless Function: receives an image (already
// resized/compressed client-side) and stores it in Vercel Blob, returning
// its public URL. Requires the same admin password as api/data.js.

// Vercel only auto-parses req.body for a handful of known content types
// (json/text/urlencoded/multipart) — for a raw image/* body it's left
// unparsed, so we read the request stream ourselves.
function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const auth = (req.headers.authorization || "").replace("Bearer ", "").trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || auth !== adminPassword) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  let put;
  try {
    put = require("@vercel/blob").put;
  } catch (e) {
    return res.status(500).json({ error: "Vercel Blob não está configurado neste projeto." });
  }

  let body;
  try {
    body = await readRawBody(req);
  } catch (e) {
    return res.status(400).json({ error: "Erro ao ler a imagem enviada." });
  }

  if (!body || !body.length) {
    return res.status(400).json({ error: "Nenhuma imagem recebida." });
  }
  if (body.length > 8 * 1024 * 1024) {
    return res.status(413).json({ error: "Imagem muito grande (máx. 8MB)." });
  }

  const contentType = req.headers["content-type"] || "image/jpeg";
  const ext = (contentType.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
  const filename = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(filename, body, { access: "public", contentType });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao enviar imagem." });
  }
};
