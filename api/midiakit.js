// api/midiakit.js — Vercel Serverless Function that server-renders "/midiakit".
// Reads stats from lib/store.js (KV-backed, refreshed weekly by an external
// job that pulls Instagram Insights and POSTs to /api/midiakit-data).

const { getMidiaKitData } = require("../lib/store.js");
const { escapeHtml } = require("../public/render-shared.js");

const nf = new Intl.NumberFormat("pt-BR");
const money = (n) => nf.format(Math.round(n || 0));
const pct = (n) => String(n).replace(".", ",");

function statCell(num, label) {
  return `<div class="mk-cell"><div class="mk-num">${escapeHtml(num)}</div><div class="mk-lbl">${escapeHtml(label)}</div></div>`;
}

function stat(num, label) {
  return `<div class="mk-stat"><div class="mk-num">${escapeHtml(num)}</div><div class="mk-lbl">${escapeHtml(label)}</div></div>`;
}

function miniStat(num, label) {
  return `<div class="mk-mini-stat"><div class="mk-num">${escapeHtml(num)}</div><div class="mk-lbl">${escapeHtml(label)}</div></div>`;
}

function barRow(label, p) {
  return `<div class="mk-bar-row">
    <div class="mk-top"><span>${escapeHtml(label)}</span><span class="mk-pct">${pct(p)}%</span></div>
    <div class="mk-bar-track"><div class="mk-bar-fill" style="width:${p}%"></div></div>
  </div>`;
}

function geoRow(label, value) {
  return `<li><span class="mk-place">${escapeHtml(label)}</span><span class="mk-val">${money(value)}</span></li>`;
}

function postCard(post) {
  const note = post.note ? ` · ${escapeHtml(post.note)}` : "";
  const dateFmt = new Date(post.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  return `<a class="mk-post-card" href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener">
    <div class="mk-photo">
      <img src="${escapeHtml(post.thumbnail)}" alt="Capa do reel ${escapeHtml(post.rank)}" loading="lazy">
      <span class="mk-rank">${escapeHtml(post.rank)}</span>
      <div class="mk-play"><span>▶</span></div>
      <span class="mk-open-hint">Ver no Instagram ↗</span>
    </div>
    <p class="mk-cap">"${escapeHtml(post.caption)}"</p>
    <div class="mk-stats"><span>Alcance <b>${money(post.reach)}</b></span><span>Views <b>${money(post.views)}</b></span><span>Salvos <b>${money(post.saves)}</b></span></div>
    <div class="mk-date">${escapeHtml(dateFmt)}${note}</div>
  </a>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");

  const d = await getMidiaKitData();
  const host = req.headers.host || "gabrielnocafe.vercel.app";
  const canonical = `https://${host}/midiakit`;
  const metaTitle = "Gabriel no Café — Mídia Kit";
  const metaDesc = `Mídia kit do @gabrielnocafe: ${money(d.profile.followers)} seguidores, alcance e audiência reais do Instagram, atualizados semanalmente.`;
  const updated = new Date(d.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

  const heroStrip = [
    statCell(money(d.profile.followers), "Seguidores (Instagram)"),
    statCell(`${(d.window90d.views / 1000).toFixed(0)}K+`, "Visualizações · 90 dias"),
    statCell(money(d.averages.reachPerReel), "Alcance médio por reel"),
    statCell(`${pct(d.averages.engagementRatePct)}%`, "Engajamento médio / post"),
  ].join("");

  const statGrid = [
    stat(money(d.profile.followers), "Seguidores totais"),
    stat(money(d.window90d.accountsEngaged), "Contas engajadas · 90d"),
    stat(money(d.window90d.totalInteractions), "Interações totais · 90d"),
    stat(money(d.window90d.views), "Visualizações · 90d"),
  ].join("");

  const secondaryStats = [
    miniStat(money(d.window90d.likes), "Curtidas"),
    miniStat(money(d.window90d.saves), "Salvamentos"),
    miniStat(money(d.window90d.shares), "Compartilhamentos"),
    miniStat(money(d.window90d.comments), "Comentários"),
    miniStat(money(d.window90d.reposts), "Reposts"),
    miniStat(money(d.averages.viewsPerReel), "Views médias / reel"),
  ].join("");

  const genderBars = d.audience.gender.map((g) => barRow(g.label, g.pct)).join("");
  const ageBars = d.audience.age.map((a) => barRow(a.label, a.pct)).join("");
  const countryRows = d.audience.countries.map((c) => geoRow(c.label, c.value)).join("");
  const cityRows = d.audience.cities.map((c) => geoRow(c.label, c.value)).join("");

  const postCards = d.topPosts.map(postCard).join("\n");
  const brandPills = d.brands.map((b) => `<span class="mk-brand-pill">${escapeHtml(b)}</span>`).join("");

  const bodyHtml = `
<div class="mk-body">
<div class="mk-wrap">

  <header class="mk-hero">
    <div class="mk-hero-top">
      <span class="mk-mark">Gabriel <span class="dot">no</span> Café</span>
      <span class="mk-badge">Mídia Kit — atualizado em ${escapeHtml(updated)}</span>
    </div>

    <div class="mk-hero-grid">
      <div>
        <div class="mk-eyebrow">Café, criatividade &amp; coisas que eu uso</div>
        <h1 class="mk-hero-title">É só<br>um <em>café.</em></h1>
        <p class="mk-hero-sub">Gabriel Siqueira — fotógrafo e filmmaker há mais de 10 anos, e a pessoa por trás do <strong style="color:var(--paper)">${escapeHtml(d.profile.instagramCoffee)}</strong>: um laboratório de café, vídeo e criatividade, filmado e editado todo santo dia.</p>
        <span class="mk-hero-hand">Todo santo dia, até alguém me impedir ☕</span>
      </div>

      <div>
        <div class="mk-hero-photo">
          <img src="/midiakit/hero.jpg" alt="Gabriel, fotógrafo e filmmaker por trás do Gabriel no Café">
        </div>
        <div class="mk-hero-caption"><span>Gabriel · fotógrafo &amp; filmmaker</span><span>2026</span></div>
      </div>
    </div>

    <div class="mk-hero-strip">${heroStrip}</div>
  </header>

  <section class="mk-section mk-about" id="sobre">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">01 — Sobre</div>
        <h2 class="mk-section-title">Quem está<br>por trás da xícara</h2>
      </div>
      <div class="mk-section-index">${escapeHtml(d.profile.site)} ↗</div>
    </div>
    <p><strong>Fotógrafo e filmmaker há mais de 10 anos</strong>, Gabriel abriu o Instagram <strong>Gabriel no Café</strong> em julho de 2026 sem pretensão — um ritual pessoal que virou um laboratório público de café, imagem e criatividade, com um vídeo novo praticamente todo dia.</p>
    <p>Depois de anos criando só para marcas e clientes, o projeto nasceu para juntar café, equipamento e as pequenas coisas do dia a dia num formato autoral: sem frescura, sem vitrine — e com a mesma régua técnica de quem vive de imagem.</p>
    <p>O conteúdo é 100% próprio: filmado, editado e narrado por ele, do roteiro ao corte final.</p>
  </section>

  <section class="mk-section" id="numeros">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">02 — Números</div>
        <h2 class="mk-section-title">Performance,<br>não achismo</h2>
      </div>
      <div class="mk-section-index">Fonte: Instagram Insights · atualizado semanalmente</div>
    </div>
    <div class="mk-stat-grid">${statGrid}</div>
    <div class="mk-window-note">Todo o canal foi lançado em julho de 2026 — os números acima já refletem os primeiros meses de operação diária.</div>
    <div class="mk-secondary-stats">${secondaryStats}</div>
  </section>

  <section class="mk-section" id="audiencia">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">03 — Audiência</div>
        <h2 class="mk-section-title">Quem tá do<br>outro lado da tela</h2>
      </div>
      <div class="mk-section-index">Base: seguidores com dados demográficos</div>
    </div>
    <div class="mk-aud-grid">
      <div class="mk-aud-block">
        <h3>Gênero</h3>
        ${genderBars}
      </div>
      <div class="mk-aud-block">
        <h3>Faixa etária</h3>
        ${ageBars}
      </div>
      <div class="mk-aud-block">
        <h3>Top países</h3>
        <ul class="mk-geo-list">${countryRows}</ul>
        <h3 style="margin-top:28px">Top cidades</h3>
        <ul class="mk-geo-list">${cityRows}</ul>
      </div>
    </div>
  </section>

  <section class="mk-section" id="conteudo">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">04 — Melhores conteúdos</div>
        <h2 class="mk-section-title">O que já<br>performou</h2>
      </div>
      <div class="mk-section-index">Reels com maior alcance orgânico</div>
    </div>
    <div class="mk-post-grid">${postCards}</div>
  </section>

  <section class="mk-section" id="marcas">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">05 — Marcas &amp; formatos</div>
        <h2 class="mk-section-title">Quem já passou<br>pelo laboratório</h2>
      </div>
    </div>
    <div class="mk-brand-cloud">${brandPills}</div>
    <p class="mk-brand-note">Integrações nascem sempre do uso real do produto no dia a dia — review, unboxing ou simplesmente aparecendo no equipamento de todo santo dia. É essa autenticidade que sustenta a taxa de engajamento acima da média do nicho.</p>

    <div class="mk-offer-grid">
      <div class="mk-offer">
        <div class="mk-n">Formato 01</div>
        <h4>Reel dedicado</h4>
        <p>Produto integrado à rotina de café do dia — filmado, editado e narrado por Gabriel, no mesmo padrão estético do feed.</p>
      </div>
      <div class="mk-offer">
        <div class="mk-n">Formato 02</div>
        <h4>Unboxing &amp; review</h4>
        <p>Primeira impressão + uso real do equipamento, com destaque para especificações que importam pra quem faz café em casa.</p>
      </div>
      <div class="mk-offer">
        <div class="mk-n">Formato 03</div>
        <h4>Presença editorial</h4>
        <p>Produto ou marca citado dentro da série educativa ("café pra leigos") ou em carrossel de conteúdo aprofundado.</p>
      </div>
    </div>
  </section>

  <section class="mk-section mk-contact" id="contato">
    <div class="mk-section-head" style="margin-top:0">
      <div class="mk-eyebrow">06 — Contato</div>
    </div>
    <div class="mk-contact-grid">
      <h2 class="mk-contact-title">Bora tomar<br>um café?<span class="mk-hand">vamos conversar sobre a parceria</span></h2>
      <ul class="mk-contact-list">
        <li><span class="mk-k">E-mail</span><span class="mk-v">${escapeHtml(d.profile.email)}</span></li>
        <li><span class="mk-k">Instagram (café)</span><span class="mk-v">${escapeHtml(d.profile.instagramCoffee)}</span></li>
        <li><span class="mk-k">Instagram (foto)</span><span class="mk-v">${escapeHtml(d.profile.instagramPhoto)}</span></li>
        <li><span class="mk-k">Site</span><span class="mk-v">${escapeHtml(d.profile.site)}</span></li>
      </ul>
    </div>
  </section>

  <div class="mk-footer">
    <span>© 2026 Gabriel Siqueira — Gabriel no Café</span>
    <span>Dados: Instagram Insights, últimos 90 dias · atualizado em ${escapeHtml(updated)}</span>
  </div>

</div>
</div>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}" />
  <meta name="theme-color" content="#14100c" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(metaTitle)}" />
  <meta property="og:description" content="${escapeHtml(metaDesc)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Fredoka:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/site.css" />
  <link rel="stylesheet" href="/midiakit.css" />
</head>
<body class="mk-body">
${bodyHtml}
</body>
</html>`);
};
