// lib/store.js — shared KV-backed data store (used by api/data.js and api/index.js)

const { DEFAULT_DATA } = require("./data.js");
const { DEFAULT_MIDIAKIT_DATA } = require("./midiakit-default.js");

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

const CLICKS_KEY = "click_counts";

// Fire-and-forget: a bad/missing id or a KV hiccup should never surface as
// an error to the visitor clicking "ver produto".
async function trackClick(id) {
  if (!kv || !id || typeof id !== "string" || id.length > 120) return;
  try {
    await kv.hincrby(CLICKS_KEY, id, 1);
  } catch (e) {}
}

async function getClickCounts() {
  if (!kv) return {};
  try {
    return (await kv.hgetall(CLICKS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

const MIDIAKIT_KEY = "midiakit_data";

async function getMidiaKitData() {
  if (kv) {
    try {
      const stored = await kv.get(MIDIAKIT_KEY);
      if (stored) return stored;
    } catch (e) {}
  }
  return DEFAULT_MIDIAKIT_DATA;
}

async function saveMidiaKitData(data) {
  if (kv) {
    try {
      await kv.set(MIDIAKIT_KEY, data);
      return true;
    } catch (e) {}
  }
  return false;
}

module.exports = {
  getData, saveData, DEFAULT_DATA, trackClick, getClickCounts,
  getMidiaKitData, saveMidiaKitData, DEFAULT_MIDIAKIT_DATA,
};
