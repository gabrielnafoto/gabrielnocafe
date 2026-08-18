// lib/data.js — fonte de verdade do conteúdo padrão (usado quando o KV está vazio)
// Campos com sufixo _en são opcionais: se vazios, o site usa o campo em PT.
//
// sections[].category → usado pelos filtros ("espresso" | "filter" | "latte-art" | "apps" | "other")
// sections[].group    → "setup" (aparece em "My Setup") ou "other" (aparece em "Other things I like")
// items[].dailyUse     → aparece na faixa "coisas que uso todos os dias"
// items[].seenInVideos → aparece na seção "seen in my videos"

const DEFAULT_DATA = {
  profile: {
    name: "Gabriel",
    handle: "@gabrielnocafe",
    role: "Fotógrafo, filmmaker & coffee creator",
    role_en: "Photographer, filmmaker & coffee creator",
    intro: "Eu sou Gabriel — fotógrafo, filmmaker e alguém que aparentemente decidiu transformar café em mais um hobby.",
    intro_en: "I'm Gabriel — a photographer, filmmaker, and someone who apparently decided to turn coffee into yet another hobby.",
    bio: "Filmando café todo santo dia até alguém me impedir ☕️",
    bio_en: "Filming coffee every single day until someone stops me ☕️",
    photo: "",
    instagram: "https://instagram.com/gabrielnocafe",
    youtube: "",
    twitter: "",
  },
  site: {
    title: "gabriel no café",
    title_en: "gabriel no café",
    tagline: "café, criatividade e as coisas que eu realmente uso.",
    tagline_en: "coffee, creativity & things I actually use.",
    headline: "é só um café.",
    headline_en: "it's just an espresso.",
    subheadline: "Abri esse Instagram sem pretensão nenhuma — virou meu ritual de paz. Aqui tá tudo que uso nele, sem frescura e sem vitrine.",
    subheadline_en: "I started this without any big plan — it turned into my daily ritual of calm. Here's everything I use in it, no fuss, no showroom.",
    affiliateNote: "Alguns links desta página são de afiliado. Posso receber uma pequena comissão caso você compre por eles, sem nenhum custo adicional pra você. Só entra aqui o que eu realmente uso ou gosto.",
    affiliateNote_en: "Some links on this page are affiliate links. I may earn a small commission if you buy through them, at no extra cost to you. I only add things I actually use or like.",
    showAffiliateNote: true,
  },
  sections: [
    {
      id: "sec_1",
      number: "01",
      title: "Espresso",
      title_en: "Espresso",
      category: "espresso",
      group: "setup",
      items: [
        {
          id: "item_1",
          label: "máquina",
          label_en: "machine",
          name: "Gaggia Classic",
          name_en: "Gaggia Classic",
          description: "A amarela da bancada. Uso principalmente pros vídeos de espresso — termobloco rápido, boiler robusto, aquela vibe retrô que aparece em quase todo vídeo.",
          description_en: "The yellow one on the counter. My main machine for espresso videos — fast thermoblock heating, solid boiler, that retro look that shows up in almost every video.",
          url: "https://example.com",
          affilliate: true,
          dailyUse: true,
          seenInVideos: true,
        },
      ],
    },
    {
      id: "sec_2",
      number: "02",
      title: "Filter",
      title_en: "Filter",
      category: "filter",
      group: "setup",
      items: [
        {
          id: "item_2",
          label: "coado",
          label_en: "pour over",
          name: "Hario V60",
          name_en: "Hario V60",
          description: "Uso principalmente pra filtrados. Compacto, fácil de ajustar e faz parte da minha rotina de todo dia — pra quando o dia pede pausa.",
          description_en: "My go-to for pour over. Compact, easy to dial in, and part of my daily routine — for when the day calls for a slower moment.",
          url: "https://example.com",
          affilliate: true,
          dailyUse: true,
          seenInVideos: true,
        },
      ],
    },
    {
      id: "sec_3",
      number: "03",
      title: "Apps",
      title_en: "Apps",
      category: "apps",
      group: "setup",
      items: [
        { id: "item_3", label: "diário de shots", label_en: "shot diary", name: "Notion", name_en: "Notion", url: "https://notion.so", affilliate: false, description: "Onde eu anoto ideia de vídeo, roteiro e receita de café.", description_en: "Where I jot down video ideas, scripts and coffee recipes." },
      ],
    },
    {
      id: "sec_4",
      number: "04",
      title: "Já testei e gostei",
      title_en: "Tried & liked",
      category: "other",
      group: "other",
      items: [
        {
          id: "item_4",
          label: "moedor",
          label_en: "grinder",
          name: "Baratza Encore ESP",
          name_en: "Baratza Encore ESP",
          description: "Testei por um tempo, gostei bastante, mas não faz parte do meu setup atual.",
          description_en: "Tried it for a while, liked it a lot, but it's not part of my current setup.",
          url: "https://example.com",
          affilliate: true,
        },
      ],
    },
  ],
};

module.exports = { DEFAULT_DATA };
