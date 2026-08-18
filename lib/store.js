// lib/store.js — shared KV-backed data store (used by api/data.js and api/index.js)

const { DEFAULT_DATA } = require("./data.js");

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

module.exports = { getData, saveData, DEFAULT_DATA };
