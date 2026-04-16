// generate-photocard — fetch URL, summarize with Lovable AI, generate image
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
  // Fallback: plain fetch
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 PatuakhaliExpressBot/1.0" },
  });
  const html = await res.text();
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, size = "square" } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: get article text
    const text = await fetchText(url);

    // Step 2: extract concise quote with Lovable AI (tool call)
    const summarize = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You extract a single short, powerful Bengali quotation (max 25 words) summarizing the key point of a Bengali news article. Return ONLY the quotation text in Bengali, no quotes, no attribution.",
          },
          { role: "user", content: text },
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
    const quote: string =
      sumData?.choices?.[0]?.message?.content?.trim() ?? "সংবাদ থেকে কোটেশন";

    // Step 3: generate background image
    const aspect =
      size === "portrait" ? "3:4 portrait" : size === "landscape" ? "16:9 wide cinematic" : "1:1 square";
    const imgPrompt = `A beautiful editorial news photocard background in ${aspect} aspect ratio. Subtle dark gradient, soft Bengali newspaper aesthetic, blurred warm tones, minimal abstract texture. NO text, NO words, NO letters in the image. Clean, suitable for overlaying a quote.`;

    const imgRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imgPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imgRes.ok) {
      const t = await imgRes.text();
      throw new Error(`AI image failed ${imgRes.status}: ${t.slice(0, 200)}`);
    }
    const imgData = await imgRes.json();
    const imageUrl: string | undefined =
      imgData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) throw new Error("No image returned");

    // Save to DB (anonymous OK due to RLS — we use service role here)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.from("photocards").insert({
      source_url: url,
      quote,
      image_url: imageUrl,
      card_size: size,
    });

    return new Response(
      JSON.stringify({ success: true, image: imageUrl, quote }),
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
