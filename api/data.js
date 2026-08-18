// api/data.js — Vercel Serverless Function (CommonJS)

const DEFAULT_DATA = {
  profile: {
    name: "Gabriel",
    handle: "@gabrielnafoto",
    bio: "Entusiasta de café · Barista em casa",
    bio_en: "Coffee enthusiast · Home barista",
    instagram: "",
    youtube: "",
    twitter: "",
  },
  site: {
    title: "setup de café",
    title_en: "coffee setup",
    headline: "o que eu uso.",
    headline_en: "what i use.",
    subheadline: "Cada equipamento, cada link. Sem vitrine — o que está na bancada é o que está aqui.",
    subheadline_en: "Every piece of gear, every link. No showroom — what's on the counter is what's here.",
    affiliateNote: "Alguns links são de afiliado. Se você comprar por eles, uma parte volta pra manter esse projeto — sem custo extra pra você.",
    affiliateNote_en: "Some links are affiliate links. If you buy through them, I get a small cut at no extra cost to you.",
    showAffiliateNote: true,
  },
  sections: [
    {
      id: "sec_1",
      number: "01",
      title: "Moer",
      title_en: "Grind",
      items: [
        {
          id: "item_1",
          label: "moedor",
          label_en: "grinder",
          name: "Baratza Encore ESP",
          name_en: "Baratza Encore ESP",
          description: "Entrada séria no espresso. Ajuste stepless, consistente, sem drama.",
          description_en: "A serious entry into espresso. Stepless adjustment, consistent, no fuss.",
          url: "https://baratza.com",
          affilliate: true,
        },
      ],
    },
    {
      id: "sec_2",
      number: "02",
      title: "Extrair",
      title_en: "Extract",
      items: [
        {
          id: "item_2",
          label: "máquina",
          label_en: "machine",
          name: "Breville Bambino Plus",
          name_en: "Breville Bambino Plus",
          description: "Termobloco rápido. Compacta pra bancada pequena, boa o suficiente pra não decepcionar.",
          description_en: "Fast thermoblock heating. Compact enough for a small counter, good enough to impress.",
          url: "https://breville.com",
          affilliate: false,
        },
      ],
    },
  ],
};

// Tenta carregar Vercel KV — só funciona quando conectado no painel do Vercel
let kv = null;
try {
  kv = require("@vercel/kv").kv;
} catch (e) {
  // KV não disponível — usa dados padrão
}

const SITE_KEY = "site_data";

async function getData() {
  if (kv) {
    try {
      const stored = await kv.get(SITE_KEY);
      if (stored) return stored;
    } catch (e) {}
  }
  return DEFAULT_DATA;
}

async function saveData(data) {
  if (kv) {
    try {
      await kv.set(SITE_KEY, data);
      return true;
    } catch (e) {}
  }
  return false;
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
      const persisted = await saveData(req.body);
      return res.status(200).json({ ok: true, persisted });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao salvar." });
    }
  }

  return res.status(405).json({ error: "Método não permitido." });
};
