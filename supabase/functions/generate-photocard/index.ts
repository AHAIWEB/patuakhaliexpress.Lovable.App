// generate-photocard — dynamic AI photocard generator with multiple styles
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type CardStyle = "minimal" | "bold" | "classic" | "photo";
type CardSize = "square" | "portrait" | "landscape";

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
  size === "portrait" ? "3:4 portrait" : size === "landscape" ? "16:9 wide cinematic" : "1:1 square";

function buildImagePrompt(opts: {
  style: CardStyle;
  size: CardSize;
  quote: string;
  detail?: string;
  attribution?: string;
  category?: string;
  siteName?: string;
  logoUrl?: string;
}) {
  const { style, size, quote, detail, attribution, category, siteName, logoUrl } = opts;
  const aspect = aspectFor(size);

  const parts: string[] = [];
  parts.push(
    `Generate a professionally designed Bengali (Bangla) news photocard image, ${aspect} aspect ratio.`,
  );

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
  }

  // Content rendering
  parts.push(
    `Render this exact Bengali quotation prominently as the main text on the card: "${quote.replace(/"/g, '\\"')}".`,
  );
  if (detail) {
    parts.push(`Below the quote, in smaller Bengali type, render this supporting detail: "${detail.slice(0, 180)}".`);
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
    "Use authentic Bengali (Bangla) script — never Latin/English text for the quote. Typography must be legible, well-kerned, and high-contrast.",
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
      category_id,
      site_name,
      logo_url,
    } = body ?? {};

    if (!url && !rawText && !providedQuote) {
      return new Response(
        JSON.stringify({ error: "url, text, or quote required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let quote: string = (providedQuote ?? "").trim();
    let finalDetail: string = (detail ?? "").trim();

    // If no manual quote, AI extracts from URL or raw text
    if (!quote) {
      const sourceText = rawText?.trim()
        ? String(rawText).slice(0, 8000)
        : await fetchText(url);

      const summarize = await fetch(AI_URL, {
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
                "You output JSON with two Bengali fields: \"quote\" (max 22 words, the most powerful headline-worthy line from the article) and \"detail\" (max 25 words, single-sentence supporting context). Return ONLY raw JSON like {\"quote\":\"...\",\"detail\":\"...\"} with no markdown, no code fences, no extra text.",
            },
            { role: "user", content: sourceText },
          ],
        }),
      });

      if (summarize.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. একটু পরে চেষ্টা করুন।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (summarize.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits শেষ। ওয়ার্কস্পেসে credits যোগ করুন।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      } catch {
        quote = cleaned || "সংবাদ থেকে কোটেশন";
      }
    }

    // Build image prompt
    const imgPrompt = buildImagePrompt({
      style: style as CardStyle,
      size: size as CardSize,
      quote,
      detail: finalDetail,
      attribution,
      category,
      siteName: site_name,
      logoUrl: logo_url,
    });

    const imgRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imgPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (imgRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI rate limit exceeded. একটু পরে চেষ্টা করুন।" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (imgRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits শেষ। credits যোগ করুন।" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      JSON.stringify({ success: true, image: imageUrl, quote, detail: finalDetail }),
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
