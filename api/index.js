// api/index.js — Vercel Serverless Function that server-renders "/".
// Crawlers and first paint get real HTML (no "carregando…" placeholder);
// public/site-client.js then hydrates for language switching and filters,
// reusing the exact same render functions from public/render-shared.js.

const { getData } = require("../lib/store.js");
const { renderApp, escapeHtml, f } = require("../public/render-shared.js");

const SITE_URL_FALLBACK = "gabrielnocafe.vercel.app";
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='%23e8a856' d='M10 0 11.5 8 20 10 11.5 12 10 20 8.5 12 0 10 8.5 8Z'/%3E%3C/svg%3E";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");

  const data = await getData();
  const p = data.profile || {};
  const s = data.site || {};

  const host = req.headers.host || SITE_URL_FALLBACK;
  const canonical = `https://${host}/`;
  const metaTitle = "Gabriel no Café — Setup, Coffee & Creativity";
  const metaDesc = "Meu setup de café, equipamentos que uso, receitas e outras coisas que fazem parte do Gabriel no Café.";

  const bodyHtml = renderApp(data, "pt");
  const dataJson = JSON.stringify(data).replace(/</g, "\\u003c");

  const navHtml = `
<header class="nav" id="site-nav">
  <a class="brand-mark" href="/">
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 0 L11.5 8 L20 10 L11.5 12 L10 20 L8.5 12 L0 10 L8.5 8 Z" fill="#e8a856"/></svg>
    ${escapeHtml(f(p, "name") || "gabriel no café")}
  </a>
  <nav class="nav-links" aria-label="navegação principal" id="nav-links">
    <a class="nav-link" href="#setup">setup</a>
    <span class="nav-soon" title="em breve">recipes</span>
    <span class="nav-soon" title="em breve">favorites</span>
    <a class="nav-link" href="#about">about</a>
  </nav>
  <div class="nav-right">
    <div class="lang-toggle">
      <button class="lang-btn active" id="btn-pt" aria-label="Português">PT</button>
      <span class="lang-sep">·</span>
      <button class="lang-btn" id="btn-en" aria-label="English">EN</button>
    </div>
    <button class="menu-btn" id="menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="menu">☰</button>
  </div>
</header>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <link rel="icon" href="${FAVICON}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(metaTitle)}" />
  <meta property="og:description" content="${escapeHtml(metaDesc)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:site_name" content="${escapeHtml(f(p, "name") || "Gabriel no Café")}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Caveat:wght@600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/site.css" />
</head>
<body>
${navHtml}
<div id="app">${bodyHtml}</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>window.__SITE_DATA__ = ${dataJson}; window.__SITE_LANG__ = "pt";</script>
<script src="/render-shared.js"></script>
<script src="/site-client.js"></script>
</body>
</html>`);
};
