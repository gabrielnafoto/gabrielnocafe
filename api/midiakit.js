// api/midiakit.js — Vercel Serverless Function that server-renders "/midiakit".
// Reads stats from lib/store.js (KV-backed, refreshed weekly by an external
// job that pulls Instagram Insights and POSTs to /api/midiakit-data).
//
// No client-side JS on this page (unlike the main site) — the PT/EN toggle
// is a plain link to ?lang=en/?lang=pt, and the server re-renders the whole
// page in that language. Simpler than replicating the main site's
// isomorphic-render + hydration setup for a page that's mostly static data.

const { getMidiaKitData } = require("../lib/store.js");
const { escapeHtml } = require("../public/render-shared.js");

const I18N = {
  pt: {
    metaTitle: "Gabriel no Café — Mídia Kit",
    metaDesc: (followers) => `Mídia kit do @gabrielnocafe: ${followers} seguidores, alcance e audiência reais do Instagram, atualizados semanalmente.`,
    badge: (updated) => `Mídia Kit — atualizado em ${updated}`,
    heroEyebrow: "Café, criatividade & coisas que eu uso",
    heroSub: (handle) => `Gabriel Siqueira — fotógrafo e filmmaker há mais de 10 anos, e a pessoa por trás do <strong style="color:var(--paper)">${handle}</strong>: um laboratório de café, vídeo e criatividade, filmado e editado todo santo dia.`,
    heroHand: "Todo santo dia, até alguém me impedir ☕",
    heroPhotoAlt: "Gabriel, fotógrafo e filmmaker por trás do Gabriel no Café",
    heroCaption: "Gabriel · fotógrafo & filmmaker",
    followersLabel: "Seguidores (Instagram)",
    viewsWindowLabel: "Visualizações · 90 dias",
    reachPerReelLabel: "Alcance médio por reel",
    engagementLabel: "Engajamento médio / post",
    aboutEyebrow: "01 — Sobre",
    aboutTitle: "Quem está<br>por trás da xícara",
    aboutP1: "<strong>Fotógrafo e filmmaker há mais de 10 anos</strong>, Gabriel abriu o Instagram <strong>Gabriel no Café</strong> em julho de 2026 sem pretensão — um ritual pessoal que virou um laboratório público de café, imagem e criatividade, com um vídeo novo praticamente todo dia.",
    aboutP2: "Depois de anos criando só para marcas e clientes, o projeto nasceu para juntar café, equipamento e as pequenas coisas do dia a dia num formato autoral: sem frescura, sem vitrine — e com a mesma régua técnica de quem vive de imagem.",
    aboutP3: "O conteúdo é 100% próprio: filmado, editado e narrado por ele, do roteiro ao corte final.",
    numbersEyebrow: "02 — Números",
    numbersTitle: "Performance,<br>não achismo",
    numbersSource: "Fonte: Instagram Insights · atualizado semanalmente",
    followersTotalLabel: "Seguidores totais",
    accountsEngagedLabel: "Contas engajadas · 90d",
    totalInteractionsLabel: "Interações totais · 90d",
    viewsLabel: "Visualizações · 90d",
    windowNote: "Todo o canal foi lançado em julho de 2026 — os números acima já refletem os primeiros meses de operação diária.",
    likesLabel: "Curtidas",
    savesLabel: "Salvamentos",
    sharesLabel: "Compartilhamentos",
    commentsLabel: "Comentários",
    repostsLabel: "Reposts",
    viewsPerReelLabel: "Views médias / reel",
    audienceEyebrow: "03 — Audiência",
    audienceTitle: "Quem tá do<br>outro lado da tela",
    audienceSource: "Base: seguidores com dados demográficos",
    genderLabel: "Gênero",
    ageLabel: "Faixa etária",
    topCountriesLabel: "Top países",
    topCitiesLabel: "Top cidades",
    contentEyebrow: "04 — Melhores conteúdos",
    contentTitle: "O que já<br>performou",
    contentSource: "Reels com maior alcance orgânico",
    reachStat: "Alcance",
    viewsStat: "Views",
    savesStat: "Salvos",
    viewOnInstagram: "Ver no Instagram ↗",
    coverAlt: (rank) => `Capa do reel ${rank}`,
    brandsEyebrow: "05 — Marcas & formatos",
    brandsTitle: "Quem já passou<br>pelo laboratório",
    brandsNote: "Integrações nascem sempre do uso real do produto no dia a dia — review, unboxing ou simplesmente aparecendo no equipamento de todo santo dia. É essa autenticidade que sustenta a taxa de engajamento acima da média do nicho.",
    format01Title: "Reel dedicado",
    format01Desc: "Produto integrado à rotina de café do dia — filmado, editado e narrado por Gabriel, no mesmo padrão estético do feed.",
    format02Title: "Unboxing &amp; review",
    format02Desc: "Primeira impressão + uso real do equipamento, com destaque para especificações que importam pra quem faz café em casa.",
    format03Title: "Presença editorial",
    format03Desc: "Produto ou marca citado dentro da série educativa (\"café pra leigos\") ou em carrossel de conteúdo aprofundado.",
    formatWord: "Formato",
    collabsEyebrow: "06 — Collabs recentes",
    collabsTitle: "Como já<br>funcionou na prática",
    collabsSource: "Números reais, do próprio Instagram",
    collabStoryLabel: "✦ Story da mesma collab",
    interactionsLabel: "Interações",
    likesShortLabel: "Curtidas",
    sharesShortLabel: "Compart.",
    stickerTapsLabel: "Toques na figurinha",
    contactEyebrow: "07 — Contato",
    contactTitle: "Bora tomar<br>um café?",
    contactHand: "vamos conversar sobre a parceria",
    emailLabel: "E-mail",
    instaCoffeeLabel: "Instagram (café)",
    instaPhotoLabel: "Instagram (foto)",
    siteLabel: "Site",
    footerCopy: "© 2026 Gabriel Siqueira — Gabriel no Café",
    footerData: (updated) => `Dados: Instagram Insights, últimos 90 dias · atualizado em ${updated}`,
    langBtn: "EN",
    dateLocale: "pt-BR",
    htmlLang: "pt-BR",
  },
  en: {
    metaTitle: "Gabriel no Café — Media Kit",
    metaDesc: (followers) => `Media kit for @gabrielnocafe: ${followers} followers, real Instagram reach and audience, updated weekly.`,
    badge: (updated) => `Media Kit — updated on ${updated}`,
    heroEyebrow: "Coffee, creativity & the things I use",
    heroSub: (handle) => `Gabriel Siqueira — a photographer and filmmaker for over 10 years, and the person behind <strong style="color:var(--paper)">${handle}</strong>: a coffee, video and creativity lab, filmed and edited every single day.`,
    heroHand: "Every single day, until someone stops me ☕",
    heroPhotoAlt: "Gabriel, photographer and filmmaker behind Gabriel no Café",
    heroCaption: "Gabriel · photographer & filmmaker",
    followersLabel: "Followers (Instagram)",
    viewsWindowLabel: "Views · 90 days",
    reachPerReelLabel: "Average reach per reel",
    engagementLabel: "Average engagement / post",
    aboutEyebrow: "01 — About",
    aboutTitle: "Who's behind<br>the cup",
    aboutP1: "<strong>A photographer and filmmaker for over 10 years</strong>, Gabriel opened the Instagram <strong>Gabriel no Café</strong> in July 2026 with no real plan — a personal ritual that turned into a public lab of coffee, image and creativity, with a new video almost every day.",
    aboutP2: "After years creating only for brands and clients, the project was born to bring together coffee, gear and the small everyday things in an authorial format: no fuss, no showcase — with the same technical bar as someone who lives off image work.",
    aboutP3: "The content is 100% original: filmed, edited and narrated by him, from script to final cut.",
    numbersEyebrow: "02 — Numbers",
    numbersTitle: "Performance,<br>not guesswork",
    numbersSource: "Source: Instagram Insights · updated weekly",
    followersTotalLabel: "Total followers",
    accountsEngagedLabel: "Accounts engaged · 90d",
    totalInteractionsLabel: "Total interactions · 90d",
    viewsLabel: "Views · 90d",
    windowNote: "The whole channel launched in July 2026 — the numbers above already reflect the first months of daily operation.",
    likesLabel: "Likes",
    savesLabel: "Saves",
    sharesLabel: "Shares",
    commentsLabel: "Comments",
    repostsLabel: "Reposts",
    viewsPerReelLabel: "Average views / reel",
    audienceEyebrow: "03 — Audience",
    audienceTitle: "Who's on the<br>other side of the screen",
    audienceSource: "Base: followers with demographic data",
    genderLabel: "Gender",
    ageLabel: "Age range",
    topCountriesLabel: "Top countries",
    topCitiesLabel: "Top cities",
    contentEyebrow: "04 — Top content",
    contentTitle: "What's already<br>performed",
    contentSource: "Reels with the highest organic reach",
    reachStat: "Reach",
    viewsStat: "Views",
    savesStat: "Saves",
    viewOnInstagram: "View on Instagram ↗",
    coverAlt: (rank) => `Reel cover ${rank}`,
    brandsEyebrow: "05 — Brands & formats",
    brandsTitle: "Who's already been<br>through the lab",
    brandsNote: "Integrations always come from real, everyday use of the product — review, unboxing, or simply showing up in the everyday gear. That authenticity is what sustains an engagement rate above the niche average.",
    format01Title: "Dedicated reel",
    format01Desc: "Product woven into the daily coffee routine — filmed, edited and narrated by Gabriel, in the same aesthetic as the feed.",
    format02Title: "Unboxing &amp; review",
    format02Desc: "First impression + real use of the gear, highlighting the specs that actually matter to home coffee makers.",
    format03Title: "Editorial presence",
    format03Desc: "Product or brand mentioned inside the educational series (\"coffee for beginners\") or a deeper-dive content carousel.",
    formatWord: "Format",
    collabsEyebrow: "06 — Recent collabs",
    collabsTitle: "How it's worked<br>in practice",
    collabsSource: "Real numbers, straight from Instagram",
    collabStoryLabel: "✦ Story from the same collab",
    interactionsLabel: "Interactions",
    likesShortLabel: "Likes",
    sharesShortLabel: "Shares",
    stickerTapsLabel: "Sticker taps",
    contactEyebrow: "07 — Contact",
    contactTitle: "Want to grab<br>a coffee?",
    contactHand: "let's talk about the partnership",
    emailLabel: "Email",
    instaCoffeeLabel: "Instagram (coffee)",
    instaPhotoLabel: "Instagram (photo)",
    siteLabel: "Website",
    footerCopy: "© 2026 Gabriel Siqueira — Gabriel no Café",
    footerData: (updated) => `Data: Instagram Insights, last 90 days · updated on ${updated}`,
    langBtn: "PT",
    dateLocale: "en-US",
    htmlLang: "en",
  },
};

// Mirrors render-shared.js's f() — reads a "<field>_en" variant when present
// and the requested language is English, otherwise the plain PT field.
function f(obj, field, lang) {
  if (!obj) return "";
  const enVal = obj[field + "_en"];
  return (lang === "en" && enVal) ? enVal : (obj[field] || "");
}

function nfFor(lang) { return new Intl.NumberFormat(lang === "en" ? "en-US" : "pt-BR"); }
const pct = (n, lang) => lang === "en" ? String(n) : String(n).replace(".", ",");

function statCell(num, label) {
  return `<div class="mk-cell"><div class="mk-num">${escapeHtml(num)}</div><div class="mk-lbl">${escapeHtml(label)}</div></div>`;
}

function stat(num, label) {
  return `<div class="mk-stat"><div class="mk-num">${escapeHtml(num)}</div><div class="mk-lbl">${escapeHtml(label)}</div></div>`;
}

function miniStat(num, label) {
  return `<div class="mk-mini-stat"><div class="mk-num">${escapeHtml(num)}</div><div class="mk-lbl">${escapeHtml(label)}</div></div>`;
}

function barRow(label, p, lang) {
  return `<div class="mk-bar-row">
    <div class="mk-top"><span>${escapeHtml(label)}</span><span class="mk-pct">${pct(p, lang)}%</span></div>
    <div class="mk-bar-track"><div class="mk-bar-fill" style="width:${p}%"></div></div>
  </div>`;
}

function geoRow(label, value, money) {
  return `<li><span class="mk-place">${escapeHtml(label)}</span><span class="mk-val">${money(value)}</span></li>`;
}

function postCard(post, lang, t, money) {
  const note = post.note ? ` · ${escapeHtml(post.note)}` : "";
  const dateFmt = new Date(post.date).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  return `<a class="mk-post-card" href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener">
    <div class="mk-photo">
      <img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(t.coverAlt(post.rank))}" loading="lazy">
      <span class="mk-rank">${escapeHtml(post.rank)}</span>
      <div class="mk-play"><span>▶</span></div>
      <span class="mk-open-hint">${escapeHtml(t.viewOnInstagram)}</span>
    </div>
    <p class="mk-cap">"${escapeHtml(f(post, "caption", lang))}"</p>
    <div class="mk-stats"><span>${escapeHtml(t.reachStat)} <b>${money(post.reach)}</b></span><span>${escapeHtml(t.viewsStat)} <b>${money(post.views)}</b></span><span>${escapeHtml(t.savesStat)} <b>${money(post.saves)}</b></span></div>
    <div class="mk-date">${escapeHtml(dateFmt)}${note}</div>
  </a>`;
}

// One card per real collab (product-seeding / permuta) — a plain-language
// summary of the deal (who sent what, what came out of it) next to the one
// confirmed post's real, traceable numbers. Never invents figures for
// deliverables that haven't run yet — a collab can list 2 reels while only
// 1 has actually posted, and the card only shows the post/story that exist.
function collabCard(c, lang, t, money) {
  const dateFmt = c.post?.date
    ? new Date(c.post.date).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    : "";
  const deliverableList = lang === "en" && c.deliverables_en ? c.deliverables_en : (c.deliverables || []);
  const deliverables = deliverableList.map((d) => `<span class="mk-collab-pill">${escapeHtml(d)}</span>`).join("");

  const postBlock = c.post ? `<a class="mk-post-card" href="${escapeHtml(c.post.permalink)}" target="_blank" rel="noopener">
      <div class="mk-photo">
        <img src="${escapeHtml(c.post.thumbnail)}" alt="${escapeHtml(t.coverAlt(""))} — ${escapeHtml(c.brand)}" loading="lazy">
        <div class="mk-play"><span>▶</span></div>
        <span class="mk-open-hint">${escapeHtml(t.viewOnInstagram)}</span>
      </div>
      <p class="mk-cap">"${escapeHtml(f(c.post, "caption", lang))}"</p>
      <div class="mk-stats"><span>${escapeHtml(t.reachStat)} <b>${money(c.post.reach)}</b></span><span>${escapeHtml(t.viewsStat)} <b>${money(c.post.views)}</b></span><span>${escapeHtml(t.savesStat)} <b>${money(c.post.saves)}</b></span></div>
      <div class="mk-date">${escapeHtml(dateFmt)}</div>
    </a>` : "";

  const storyBlock = c.story ? `<div class="mk-collab-story">
      <span class="mk-collab-story-label">${escapeHtml(t.collabStoryLabel)}</span>
      <div class="mk-collab-story-stats">
        <span>${escapeHtml(t.viewsStat)} <b>${money(c.story.views)}</b></span>
        <span>${escapeHtml(t.interactionsLabel)} <b>${money(c.story.interactions)}</b></span>
        <span>${escapeHtml(t.likesShortLabel)} <b>${money(c.story.likes)}</b></span>
        <span>${escapeHtml(t.sharesShortLabel)} <b>${money(c.story.shares)}</b></span>
        <span>${escapeHtml(t.stickerTapsLabel)} <b>${money(c.story.stickerTaps)}</b></span>
      </div>
    </div>` : "";

  return `<div class="mk-collab-card">
    <div class="mk-collab-text">
      <div class="mk-collab-head">
        <span class="mk-collab-brand">${escapeHtml(c.brand)}</span>
        <span class="mk-collab-kind">${escapeHtml(f(c, "kind", lang))}</span>
      </div>
      <p class="mk-collab-summary">${escapeHtml(f(c, "summary", lang))}</p>
      ${deliverables ? `<div class="mk-collab-deliverables">${deliverables}</div>` : ""}
      ${storyBlock}
    </div>
    ${postBlock}
  </div>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");

  const url = new URL(req.url, "http://x");
  const lang = url.searchParams.get("lang") === "en" ? "en" : "pt";
  const t = I18N[lang];
  const money = (n) => nfFor(lang).format(Math.round(n || 0));

  const d = await getMidiaKitData();
  const host = req.headers.host || "gabrielnocafe.vercel.app";
  const canonical = `https://${host}/midiakit${lang === "en" ? "?lang=en" : ""}`;
  const metaTitle = t.metaTitle;
  const metaDesc = t.metaDesc(money(d.profile.followers));
  const updated = new Date(d.updatedAt).toLocaleDateString(t.dateLocale, { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

  const heroStrip = [
    statCell(money(d.profile.followers), t.followersLabel),
    statCell(`${(d.window90d.views / 1000).toFixed(0)}K+`, t.viewsWindowLabel),
    statCell(money(d.averages.reachPerReel), t.reachPerReelLabel),
    statCell(`${pct(d.averages.engagementRatePct, lang)}%`, t.engagementLabel),
  ].join("");

  const statGrid = [
    stat(money(d.profile.followers), t.followersTotalLabel),
    stat(money(d.window90d.accountsEngaged), t.accountsEngagedLabel),
    stat(money(d.window90d.totalInteractions), t.totalInteractionsLabel),
    stat(money(d.window90d.views), t.viewsLabel),
  ].join("");

  const secondaryStats = [
    miniStat(money(d.window90d.likes), t.likesLabel),
    miniStat(money(d.window90d.saves), t.savesLabel),
    miniStat(money(d.window90d.shares), t.sharesLabel),
    miniStat(money(d.window90d.comments), t.commentsLabel),
    miniStat(money(d.window90d.reposts), t.repostsLabel),
    miniStat(money(d.averages.viewsPerReel), t.viewsPerReelLabel),
  ].join("");

  const genderBars = d.audience.gender.map((g) => barRow(g.label, g.pct, lang)).join("");
  const ageBars = d.audience.age.map((a) => barRow(a.label, a.pct, lang)).join("");
  const countryRows = d.audience.countries.map((c) => geoRow(c.label, c.value, money)).join("");
  const cityRows = d.audience.cities.map((c) => geoRow(c.label, c.value, money)).join("");

  const postCards = d.topPosts.map((p) => postCard(p, lang, t, money)).join("\n");
  const brandPills = d.brands.map((b) => `<span class="mk-brand-pill">${escapeHtml(b)}</span>`).join("");
  const collabCards = (d.collabs || []).map((c) => collabCard(c, lang, t, money)).join("");

  const langHref = lang === "en" ? "/midiakit" : "/midiakit?lang=en";

  const bodyHtml = `
<div class="mk-body">
<div class="mk-wrap">

  <header class="mk-hero">
    <div class="mk-hero-top">
      <span class="mk-mark">Gabriel <span class="dot">no</span> Café</span>
      <a class="mk-lang-toggle" href="${escapeHtml(langHref)}">${escapeHtml(t.langBtn)}</a>
      <span class="mk-badge">${escapeHtml(t.badge(updated))}</span>
    </div>

    <div class="mk-hero-grid">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.heroEyebrow)}</div>
        <h1 class="mk-hero-title">${lang === "en" ? "It's just<br>a <em>coffee.</em>" : "É só<br>um <em>café.</em>"}</h1>
        <p class="mk-hero-sub">${t.heroSub(escapeHtml(d.profile.instagramCoffee))}</p>
        <span class="mk-hero-hand">${escapeHtml(t.heroHand)}</span>
      </div>

      <div>
        <div class="mk-hero-photo">
          <img src="/midiakit/hero.jpg" alt="${escapeHtml(t.heroPhotoAlt)}">
        </div>
        <div class="mk-hero-caption"><span>${escapeHtml(t.heroCaption)}</span><span>2026</span></div>
      </div>
    </div>

    <div class="mk-hero-strip">${heroStrip}</div>
  </header>

  <section class="mk-section mk-about" id="sobre">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.aboutEyebrow)}</div>
        <h2 class="mk-section-title">${t.aboutTitle}</h2>
      </div>
      <div class="mk-section-index">${escapeHtml(d.profile.site)} ↗</div>
    </div>
    <p>${t.aboutP1}</p>
    <p>${t.aboutP2}</p>
    <p>${t.aboutP3}</p>
  </section>

  <section class="mk-section" id="numeros">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.numbersEyebrow)}</div>
        <h2 class="mk-section-title">${t.numbersTitle}</h2>
      </div>
      <div class="mk-section-index">${escapeHtml(t.numbersSource)}</div>
    </div>
    <div class="mk-stat-grid">${statGrid}</div>
    <div class="mk-window-note">${escapeHtml(t.windowNote)}</div>
    <div class="mk-secondary-stats">${secondaryStats}</div>
  </section>

  <section class="mk-section" id="audiencia">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.audienceEyebrow)}</div>
        <h2 class="mk-section-title">${t.audienceTitle}</h2>
      </div>
      <div class="mk-section-index">${escapeHtml(t.audienceSource)}</div>
    </div>
    <div class="mk-aud-grid">
      <div class="mk-aud-block">
        <h3>${escapeHtml(t.genderLabel)}</h3>
        ${genderBars}
      </div>
      <div class="mk-aud-block">
        <h3>${escapeHtml(t.ageLabel)}</h3>
        ${ageBars}
      </div>
      <div class="mk-aud-block">
        <h3>${escapeHtml(t.topCountriesLabel)}</h3>
        <ul class="mk-geo-list">${countryRows}</ul>
        <h3 style="margin-top:28px">${escapeHtml(t.topCitiesLabel)}</h3>
        <ul class="mk-geo-list">${cityRows}</ul>
      </div>
    </div>
  </section>

  <section class="mk-section" id="conteudo">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.contentEyebrow)}</div>
        <h2 class="mk-section-title">${t.contentTitle}</h2>
      </div>
      <div class="mk-section-index">${escapeHtml(t.contentSource)}</div>
    </div>
    <div class="mk-post-grid">${postCards}</div>
  </section>

  <section class="mk-section" id="marcas">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.brandsEyebrow)}</div>
        <h2 class="mk-section-title">${t.brandsTitle}</h2>
      </div>
    </div>
    <div class="mk-brand-cloud">${brandPills}</div>
    <p class="mk-brand-note">${escapeHtml(t.brandsNote)}</p>

    <div class="mk-offer-grid">
      <div class="mk-offer">
        <div class="mk-n">${escapeHtml(t.formatWord)} 01</div>
        <h4>${escapeHtml(t.format01Title)}</h4>
        <p>${escapeHtml(t.format01Desc)}</p>
      </div>
      <div class="mk-offer">
        <div class="mk-n">${escapeHtml(t.formatWord)} 02</div>
        <h4>${t.format02Title}</h4>
        <p>${escapeHtml(t.format02Desc)}</p>
      </div>
      <div class="mk-offer">
        <div class="mk-n">${escapeHtml(t.formatWord)} 03</div>
        <h4>${escapeHtml(t.format03Title)}</h4>
        <p>${t.format03Desc}</p>
      </div>
    </div>
  </section>

  ${collabCards ? `<section class="mk-section" id="collabs">
    <div class="mk-section-head">
      <div>
        <div class="mk-eyebrow">${escapeHtml(t.collabsEyebrow)}</div>
        <h2 class="mk-section-title">${t.collabsTitle}</h2>
      </div>
      <div class="mk-section-index">${escapeHtml(t.collabsSource)}</div>
    </div>
    <div class="mk-collab-list">${collabCards}</div>
  </section>` : ""}

  <section class="mk-section mk-contact" id="contato">
    <div class="mk-section-head" style="margin-top:0">
      <div class="mk-eyebrow">${escapeHtml(t.contactEyebrow)}</div>
    </div>
    <div class="mk-contact-grid">
      <h2 class="mk-contact-title">${t.contactTitle}<span class="mk-hand">${escapeHtml(t.contactHand)}</span></h2>
      <ul class="mk-contact-list">
        <li><span class="mk-k">${escapeHtml(t.emailLabel)}</span><span class="mk-v">${escapeHtml(d.profile.email)}</span></li>
        <li><span class="mk-k">${escapeHtml(t.instaCoffeeLabel)}</span><span class="mk-v">${escapeHtml(d.profile.instagramCoffee)}</span></li>
        <li><span class="mk-k">${escapeHtml(t.instaPhotoLabel)}</span><span class="mk-v">${escapeHtml(d.profile.instagramPhoto)}</span></li>
        <li><span class="mk-k">${escapeHtml(t.siteLabel)}</span><span class="mk-v">${escapeHtml(d.profile.site)}</span></li>
      </ul>
    </div>
  </section>

  <div class="mk-footer">
    <span>${escapeHtml(t.footerCopy)}</span>
    <span>${escapeHtml(t.footerData(updated))}</span>
  </div>

</div>
</div>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(200).send(`<!DOCTYPE html>
<html lang="${escapeHtml(t.htmlLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDesc)}" />
  <meta name="theme-color" content="#14100c" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <link rel="alternate" hreflang="pt-BR" href="https://${escapeHtml(host)}/midiakit" />
  <link rel="alternate" hreflang="en" href="https://${escapeHtml(host)}/midiakit?lang=en" />
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
