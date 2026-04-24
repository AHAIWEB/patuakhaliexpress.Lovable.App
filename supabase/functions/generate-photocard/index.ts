// generate-photocard — dynamic AI photocard generator
// Modes: text/quote, text+image (composited as background), image-only (AI caption), infographic
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type CardStyle = "minimal" | "bold" | "classic" | "photo" | "infographic" | "quote-mark";
type CardSize = "square" | "portrait" | "landscape";
type Mode = "text" | "image-text" | "image-only" | "infographic";

async function fetchText(url: string): Promise<string> {
  const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (fcKey) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fcKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      const data = await res.json();
      const md = data?.data?.markdown ?? data?.markdown;
      if (md) return md.slice(0, 8000);
    } catch {
      // fall through
    }
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 PatuakhaliExpressBot/1.0" },
  });
  const html = await res.text();
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
}

const aspectFor = (size: CardSize) =>
  size === "portrait"
    ? "3:4 portrait orientation, 1080x1440 pixels"
    : size === "landscape"
    ? "16:9 widescreen cinematic, 1920x1080 pixels"
    : "1:1 perfect square, 1080x1080 pixels";

function buildImagePrompt(opts: {
  style: CardStyle;
  size: CardSize;
  quote: string;
  detail?: string;
  attribution?: string;
  category?: string;
  siteName?: string;
  logoUrl?: string;
  bullets?: string[];
  hasUserImage?: boolean;
}) {
  const { style, size, quote, detail, attribution, category, siteName, logoUrl, bullets, hasUserImage } = opts;
  const aspect = aspectFor(size);

  const parts: string[] = [];
  parts.push(
    `Generate a polished, social-media-ready Bengali (Bangla) photocard, ${aspect}.`,
  );

  if (hasUserImage) {
    parts.push(
      "Use the provided reference image as the visual base / subject of the card. Preserve the subject and key details, but enhance composition and add typography overlay tastefully.",
    );
  }

  // Style direction
  switch (style) {
    case "minimal":
      parts.push(
        "Style: clean editorial minimal — soft off-white or cream background, generous negative space, very thin elegant border, large centered Bengali quote in serif typography, small subtle category label at top.",
      );
      break;
    case "bold":
      parts.push(
        "Style: bold magazine cover — vibrant gradient background (deep red to orange or purple to pink), large bold Bengali serif headline, accent color bar on the left, dramatic typography hierarchy, eye-catching for social media.",
      );
      break;
    case "classic":
      parts.push(
        "Style: classic newspaper — cream/off-white textured paper background, double-rule horizontal lines above and below the quote, drop-cap first letter, traditional Bengali serif typography, vintage editorial feel.",
      );
      break;
    case "photo":
      parts.push(
        "Style: photo-overlay — atmospheric blurred photographic background relevant to the topic, dark gradient overlay from bottom for legibility, white Bengali quote text overlaid centered or bottom-aligned.",
      );
      break;
    case "quote-mark":
      parts.push(
        "Style: quotation card — large decorative opening quotation mark (\u201C) in a bright accent color at the top-left, Bengali quote rendered in elegant serif type, attribution as a small italic line at bottom right, soft pastel background, refined editorial layout suitable for Instagram/Facebook.",
      );
      break;
    case "infographic":
      parts.push(
        "Style: infographic card — structured layout with a clear bold Bengali title at the top, then a numbered or bulleted list of facts/stats rendered as discrete blocks with iconography, balanced color palette (1 primary + 2 accents), grid alignment, modern data-journalism aesthetic.",
      );
      break;
  }

  // Content rendering — render Bangla precisely
  parts.push(
    `Render this exact Bengali text prominently as the main headline/quote on the card (do NOT translate, do NOT alter): "${quote.replace(/"/g, '\\"')}".`,
  );
  if (bullets && bullets.length) {
    parts.push(
      `Render these Bengali bullet points as separate visually-distinct items on the card: ${bullets
        .map((b, i) => `${i + 1}) "${b.replace(/"/g, '\\"').slice(0, 80)}"`)
        .join("; ")}.`,
    );
  }
  if (detail) {
    parts.push(`Below the quote, in smaller Bengali type, render this supporting detail: "${detail.slice(0, 200)}".`);
  }
  if (attribution) {
    parts.push(`Render attribution in small italic Bengali text: "— ${attribution}".`);
  }
  if (category) {
    parts.push(`Show a small category label at the top: "${category}".`);
  }
  if (siteName) {
    parts.push(`Show the site name "${siteName}" subtly in a corner as a watermark/byline.`);
  }
  if (logoUrl) {
    parts.push("Reserve a small clean square area in one corner for a logo overlay (the logo will be composited separately, leave background simple there).");
  }
  parts.push(
    "CRITICAL: Use authentic Bengali (বাংলা) script for ALL text — never Latin/English transliteration. Render every Bengali character correctly with proper conjuncts (যুক্তাক্ষর) and matras. Typography must be sharp, well-kerned, high-contrast and instantly legible on mobile. Do not introduce typos. Do not mix English words unless explicitly present in the input.",
  );

  return parts.join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      url,
      text: rawText,
      quote: providedQuote,
      detail,
      attribution,
      category,
      style = "minimal",
      size = "square",
      mode = "text",
      bullets,
      image_data_url, // user-uploaded image (data URL)
      category_id,
      site_name,
      logo_url,
    } = body ?? {};

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMode = mode as Mode;

    // Validate inputs per mode
    if (userMode === "image-only" && !image_data_url) {
      return new Response(JSON.stringify({ error: "image-only mode-এ একটি ছবি প্রয়োজন" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userMode === "image-text" && !image_data_url) {
      return new Response(JSON.stringify({ error: "image-text mode-এ একটি ছবি প্রয়োজন" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (
      (userMode === "text" || userMode === "infographic") &&
      !url &&
      !rawText &&
      !providedQuote &&
      !(bullets && bullets.length)
    ) {
      return new Response(
        JSON.stringify({ error: "url, text, quote, অথবা bullets দরকার" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let quote: string = (providedQuote ?? "").trim();
    let finalDetail: string = (detail ?? "").trim();
    let finalBullets: string[] | undefined =
      Array.isArray(bullets) && bullets.length
        ? bullets.map((b: unknown) => String(b)).filter(Boolean).slice(0, 6)
        : undefined;

    // image-only → AI extracts a Bangla caption/quote from the image
    if (userMode === "image-only" && !quote) {
      const visionRes = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a Bengali news editor. Look at the image and write JSON: {\"quote\":\"<a powerful 1-line Bengali headline/caption, max 18 words>\",\"detail\":\"<one supporting Bengali sentence, max 22 words>\"}. Return ONLY raw JSON, no markdown, no code fences.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "এই ছবি থেকে একটি বাংলা ক্যাপশন/হেডলাইন তৈরি করো।" },
                { type: "image_url", image_url: { url: image_data_url } },
              ],
            },
          ],
        }),
      });
      if (visionRes.status === 429 || visionRes.status === 402) {
        return new Response(
          JSON.stringify({
            error: visionRes.status === 429 ? "AI rate limit exceeded। একটু পরে চেষ্টা করুন।" : "AI credits শেষ।",
          }),
          { status: visionRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!visionRes.ok) {
        const t = await visionRes.text();
        throw new Error(`Vision caption failed ${visionRes.status}: ${t.slice(0, 200)}`);
      }
      const vd = await visionRes.json();
      const raw = vd?.choices?.[0]?.message?.content?.trim() ?? "";
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        quote = String(parsed.quote ?? "").trim() || "ছবির গল্প";
        if (!finalDetail) finalDetail = String(parsed.detail ?? "").trim();
      } catch {
        quote = cleaned || "ছবির গল্প";
      }
    }

    // text / infographic auto: extract quote from URL or text if none given
    if (!quote && (userMode === "text" || userMode === "infographic")) {
      const sourceText = rawText?.trim()
        ? String(rawText).slice(0, 8000)
        : await fetchText(url);

      const sysPrompt =
        userMode === "infographic"
          ? "You output strict JSON: {\"quote\":\"<short Bengali title, max 12 words>\",\"detail\":\"<one Bengali context line, max 20 words>\",\"bullets\":[\"<bullet 1 in Bengali, max 12 words>\",\"<bullet 2>\",\"<bullet 3>\",\"<bullet 4>\"]}. Return ONLY raw JSON, no code fences."
          : "You output JSON with two Bengali fields: \"quote\" (max 22 words, the most powerful headline-worthy line) and \"detail\" (max 25 words, single-sentence supporting context). Return ONLY raw JSON like {\"quote\":\"...\",\"detail\":\"...\"} with no markdown.";

      const summarize = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: sourceText },
          ],
        }),
      });
      if (summarize.status === 429 || summarize.status === 402) {
        return new Response(
          JSON.stringify({
            error: summarize.status === 429 ? "AI rate limit exceeded।" : "AI credits শেষ।",
          }),
          { status: summarize.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!summarize.ok) {
        const t = await summarize.text();
        throw new Error(`AI summarize failed ${summarize.status}: ${t.slice(0, 200)}`);
      }
      const sumData = await summarize.json();
      const raw = sumData?.choices?.[0]?.message?.content?.trim() ?? "";
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      try {
        const parsed = JSON.parse(cleaned);
        quote = String(parsed.quote ?? "").trim() || "সংবাদ থেকে কোটেশন";
        if (!finalDetail) finalDetail = String(parsed.detail ?? "").trim();
        if (!finalBullets && Array.isArray(parsed.bullets)) {
          finalBullets = parsed.bullets.map((b: unknown) => String(b)).filter(Boolean).slice(0, 6);
        }
      } catch {
        quote = cleaned || "সংবাদ থেকে কোটেশন";
      }
    }

    // Pick image-style based on mode
    let effectiveStyle: CardStyle = style as CardStyle;
    if (userMode === "infographic") effectiveStyle = "infographic";
    else if (userMode === "image-text" || userMode === "image-only") {
      // photo-style if user didn't pick a creative style
      if (effectiveStyle === "minimal") effectiveStyle = "photo";
    }

    // Build image generation prompt
    const imgPrompt = buildImagePrompt({
      style: effectiveStyle,
      size: size as CardSize,
      quote,
      detail: finalDetail,
      attribution,
      category,
      siteName: site_name,
      logoUrl: logo_url,
      bullets: finalBullets,
      hasUserImage: !!image_data_url,
    });

    // For image-text / image-only modes, send the user image as multimodal input so
    // the model uses it as the visual base of the new card (Gemini image edit).
    const userContent: unknown =
      image_data_url
        ? [
            { type: "text", text: imgPrompt },
            { type: "image_url", image_url: { url: image_data_url } },
          ]
        : imgPrompt;

    const imgRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (imgRes.status === 429 || imgRes.status === 402) {
      return new Response(
        JSON.stringify({
          error: imgRes.status === 429 ? "AI rate limit exceeded।" : "AI credits শেষ।",
        }),
        { status: imgRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!imgRes.ok) {
      const t = await imgRes.text();
      throw new Error(`AI image failed ${imgRes.status}: ${t.slice(0, 200)}`);
    }
    const imgData = await imgRes.json();
    const imageUrl: string | undefined =
      imgData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) throw new Error("No image returned");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("photocards").insert({
      source_url: url ?? null,
      quote,
      image_url: imageUrl,
      card_size: size,
      category_id: category_id ?? null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        image: imageUrl,
        quote,
        detail: finalDetail,
        bullets: finalBullets ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("generate-photocard error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
