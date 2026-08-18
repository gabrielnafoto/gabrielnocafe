// lib/data.js — fonte de verdade do conteúdo padrão (usado quando o KV está vazio)
// Campos com sufixo _en são opcionais: se vazios, o site usa o campo em PT.

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
        {
          id: "item_2",
          label: "dosador",
          label_en: "dosing ring",
          name: "Anel Dosador 58mm",
          name_en: "Dosing Ring 58mm",
          description: "Elimina perda de café na hora de moer direto no portafiltro.",
          description_en: "Eliminates coffee waste when grinding directly into the portafilter.",
          url: "https://aliexpress.com",
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
          id: "item_3",
          label: "máquina",
          label_en: "machine",
          name: "Breville Bambino Plus",
          name_en: "Breville Bambino Plus",
          description: "Aquecimento termobloco rápido. Compacta pra bancada pequena, boa o suficiente pra não decepcionar.",
          description_en: "Fast thermoblock heating. Compact enough for a small counter, good enough to impress.",
          url: "https://breville.com",
          affilliate: false,
        },
      ],
    },
    {
      id: "sec_3",
      number: "03",
      title: "Apps",
      title_en: "Apps",
      type: "grid",
      items: [
        { id: "item_4", label: "Extração", label_en: "Extraction", name: "Acaia App", name_en: "Acaia App", url: "https://acaia.co", affilliate: false, description: "", description_en: "" },
        { id: "item_5", label: "Diário de shots", label_en: "Shot diary", name: "Notion", name_en: "Notion", url: "https://notion.so", affilliate: false, description: "", description_en: "" },
      ],
    },
  ],
};

module.exports = { DEFAULT_DATA };
