// api/og.js — dynamic Open Graph / Twitter share image (1200x630).
// Runs on the Edge Runtime (required by @vercel/og / Satori). Built from the
// real site data (name, tagline, headline) — no invented content, no static
// asset to keep in sync by hand.

import { ImageResponse } from "@vercel/og";
import { getData } from "../lib/store.js";
// render-shared.js is a UMD/CommonJS module — named-export interop for it
// isn't reliable across bundlers/runtimes, so pull it in as the default
// export and destructure explicitly instead.
import renderShared from "../public/render-shared.js";
const { clean } = renderShared;

export const config = { runtime: "edge" };

const INK = "#14100c";
const PAPER = "#f4ece0";
const AMBER = "#e8a856";
const MUTED = "rgba(244, 236, 224, .58)";

// Google's CSS2 endpoint serves TrueType (not WOFF2) when asked without a
// browser User-Agent — Satori can only embed TTF/OTF, so this is the trick
// that lets us fetch the real Fredoka face at request time instead of
// bundling a font file.
async function loadFredoka(text) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Fredoka:wght@700&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('truetype'\)/);
  if (!match) throw new Error("font css did not resolve");
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error("font file fetch failed");
  return res.arrayBuffer();
}

function splitHeadline(headline) {
  const words = headline.trim().split(/\s+/);
  const last = (words.pop() || "").replace(/[.!?]+$/, "");
  return { lead: words.join(" "), last };
}

export default async function handler() {
  const data = await getData();
  const profile = data.profile || {};
  const site = data.site || {};

  const name = clean(profile.name) || "Gabriel";
  const tagline = clean(site.tagline) || "café, criatividade e as coisas que eu realmente uso.";
  const headline = clean(site.headline) || "é só um café.";
  const { lead, last } = splitHeadline(headline);
  const sampleText = `${name}${tagline}${lead}${last}✦`;

  let fonts = [];
  try {
    fonts = [{ name: "Fredoka", data: await loadFredoka(sampleText), weight: 700, style: "normal" }];
  } catch (e) {
    // If the font fetch ever fails, fall back to Satori's default sans —
    // a plain card beats a broken share link.
  }

  const image = new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: INK,
          backgroundImage: `radial-gradient(ellipse 900px 500px at 85% 15%, rgba(232,168,86,0.14), transparent 60%)`,
          fontFamily: fonts.length ? "Fredoka" : "sans-serif",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: `2px solid ${AMBER}`,
                borderRadius: "999px",
                padding: "10px 22px 10px 14px",
                alignSelf: "flex-start",
              },
              children: [
                { type: "div", props: { style: { width: "10px", height: "10px", borderRadius: "999px", backgroundColor: AMBER, display: "flex" } } },
                { type: "div", props: { style: { color: AMBER, fontSize: "22px", letterSpacing: "1px", textTransform: "uppercase", display: "flex" }, children: tagline } },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", color: PAPER, fontSize: "108px", lineHeight: 0.92, textTransform: "uppercase", letterSpacing: "-2px" },
              children: [
                lead ? { type: "div", props: { style: { display: "flex" }, children: lead } } : null,
                { type: "div", props: { style: { display: "flex", color: AMBER }, children: `${last}.` } },
              ].filter(Boolean),
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "2px solid rgba(244,236,224,0.14)", paddingTop: "28px" },
              children: [
                { type: "div", props: { style: { display: "flex", color: PAPER, fontSize: "30px" }, children: name } },
                { type: "div", props: { style: { display: "flex", color: MUTED, fontSize: "22px" }, children: profile.handle || "" } },
              ],
            },
          },
        ],
      },
    },
    { width: 1200, height: 630, fonts }
  );

  // @vercel/og sets its own Cache-Control internally and appends rather than
  // replaces — rebuild the response so the header we actually want wins.
  return new Response(image.body, {
    status: image.status,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
