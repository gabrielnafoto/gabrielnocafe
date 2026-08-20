// lib/midiakit-default.js — seed/fallback data for /midiakit, used when the
// KV store is empty. Refreshed weekly by a scheduled job that pulls fresh
// Instagram Insights (via Windsor.ai) and POSTs to /api/midiakit-data.

const DEFAULT_MIDIAKIT_DATA = {
  updatedAt: "2026-08-20T00:00:00.000Z",
  profile: {
    name: "Gabriel Siqueira",
    role: "Fotógrafo · Filmmaker · Coffee Creator",
    handle: "@gabrielnocafe",
    followers: 4197,
    following: 449,
    mediaCount: 33,
    email: "contato@gabrielnafoto.com.br",
    instagramCoffee: "@gabrielnocafe",
    instagramPhoto: "@gabrielnafoto",
    site: "gabrielnocafe.vercel.app",
  },
  window90d: {
    accountsEngaged: 36624,
    likes: 39418,
    comments: 2125,
    saves: 7497,
    shares: 4694,
    reposts: 777,
    totalInteractions: 59756,
    views: 675101,
  },
  averages: {
    reachPerReel: 6036,
    engagementPerPost: 693,
    viewsPerReel: 8191,
    engagementRatePct: 16.9,
  },
  audience: {
    // Instagram Insights: F/M/U — 842/2670/606 of 4118 with data.
    gender: [
      { label: "Masculino", pct: 64.8 },
      { label: "Feminino", pct: 20.4 },
      { label: "Não informado", pct: 14.7 },
    ],
    age: [
      { label: "25–34 anos", pct: 59.9 },
      { label: "35–44 anos", pct: 25.4 },
      { label: "18–24 anos", pct: 9.8 },
      { label: "45+ anos", pct: 4.5 },
    ],
    countries: [
      { label: "🇧🇷 Brasil", value: 1646 },
      { label: "🇲🇽 México", value: 212 },
      { label: "🇺🇸 Estados Unidos", value: 207 },
      { label: "🇨🇴 Colômbia", value: 191 },
      { label: "🇮🇩 Indonésia", value: 133 },
      { label: "🇮🇷 Irã", value: 99 },
    ],
    cities: [
      { label: "São Paulo", value: 280 },
      { label: "Recife", value: 170 },
      { label: "Lima", value: 64 },
      { label: "Rio de Janeiro", value: 58 },
    ],
  },
  topPosts: [
    {
      rank: "01",
      caption: "Descobri que fazer café ouvindo música e filmando aumenta em 73% as chances de esquecer que você tem boletos pra pagar.",
      reach: 43084,
      views: 55949,
      saves: 1268,
      date: "2026-07-29",
      note: "",
      permalink: "https://www.instagram.com/reel/DbZHZIAukVU/",
      thumbnail: "/midiakit/thumb-01.jpg",
    },
    {
      rank: "02",
      caption: "POV: você chama um amigo pra tomar café e, cinco minutos depois, já tá inserido nas ideias caóticas.",
      reach: 37280,
      views: 49309,
      saves: 713,
      date: "2026-07-17",
      note: "",
      permalink: "https://www.instagram.com/reel/Da6byKLOmad/",
      thumbnail: "/midiakit/thumb-02.jpg",
    },
    {
      rank: "03",
      caption: "\"É café ou química?\" — abertura da série educativa sobre café especial.",
      reach: 17728,
      views: 21904,
      saves: 196,
      date: "2026-08-06",
      note: "",
      permalink: "https://www.instagram.com/reel/Dbt7jbjuY43/",
      thumbnail: "/midiakit/thumb-03.jpg",
    },
    {
      rank: "04",
      caption: "Claramente eu não sabia o que tava fazendo… é melhor me deixar fazendo só café mesmo.",
      reach: 14710,
      views: 20945,
      saves: 301,
      date: "2026-07-12",
      note: "",
      permalink: "https://www.instagram.com/reel/DatWJmgut-F/",
      thumbnail: "/midiakit/thumb-04.jpg",
    },
    {
      rank: "05",
      caption: "Start na semana com um good coffee e uma good música.",
      reach: 13557,
      views: 18522,
      saves: 130,
      date: "2026-07-27",
      note: "",
      permalink: "https://www.instagram.com/reel/DbT9RUXuaSK/",
      thumbnail: "/midiakit/thumb-05.jpg",
    },
    {
      rank: "06",
      caption: "Chegamos a 30 vídeos, 3.000 seguidores, em quase 30 dias, só postando coisa sobre café.",
      reach: 11729,
      views: 16042,
      saves: 152,
      date: "2026-08-07",
      note: "",
      permalink: "https://www.instagram.com/reel/DbwSmLEO3B5/",
      thumbnail: "/midiakit/thumb-06.jpg",
    },
  ],
  brands: [
    "Timemore", "Gaggia Brasil", "Veraz Cafés", "Dropit",
    "Not the Same Café", "Café Filomena Estefania", "O Seu Una", "São Paulo Coffee Festival",
  ],
  // A collab gets its own card (product-seeding / permuta): who, what was
  // sent, the deliverables, and the one confirmed post + its real early
  // numbers — never invented, always traceable back to the platform.
  collabs: [
    {
      brand: "Timemore",
      kind: "Permuta — produtos por conteúdo",
      summary: "A Timemore enviou 6 produtos para uma parceria com 2 reels e 3 stories, mostrando o uso no dia a dia, no meu estilo de comunicação de sempre — nada de roteiro de marca, só o café acontecendo.",
      deliverables: ["2 reels", "3 stories"],
      post: {
        caption: "\"Quanto tempo tu demora fazendo teu café?\" — reel com os produtos Timemore no uso real, dia a dia.",
        reach: 11529,
        views: 18551,
        saves: 92,
        date: "2026-08-17",
        permalink: "https://www.instagram.com/reel/DcKI2Inu9TK/",
        thumbnail: "/midiakit/thumb-timemore.jpg",
      },
      // One representative story from the same collab — views/interactions
      // from Instagram's own story insights, captured before the 24h expiry.
      story: {
        views: 1399,
        interactions: 145,
        likes: 116,
        shares: 5,
        stickerTaps: 122,
      },
    },
  ],
};

module.exports = { DEFAULT_MIDIAKIT_DATA };
