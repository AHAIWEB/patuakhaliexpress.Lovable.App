// run-scrapers — fetches active scraper_configs and ingests posts
// Hybrid: RSS (XML parse) + Firecrawl (scrape + AI extraction via Lovable AI)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScraperRow {
  id: string;
  url: string;
  method: "rss" | "firecrawl";
  category_id: string | null;
  source_id: string | null;
  interval_minutes: number;
  last_run_at: string | null;
}

interface ParsedItem {
  title: string;
  link: string;
  description?: string;
  image?: string;
  pubDate?: string;
  content?: string;
}

const slugify = (s: string) => {
  const base = s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-\u0980-\u09FF]/g, "")
    .slice(0, 80);
  return base || `post-${Date.now().toString(36)}`;
};

// Parse RSS XML
function parseRss(xml: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag: string) => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const r = re.exec(block);
      if (!r) return undefined;
      return r[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    };
    const title = get("title");
    const link = get("link");
    if (!title || !link) continue;
    const description = get("description");
    const pubDate = get("pubDate") || get("dc:date");
    let image: string | undefined;
    const enc = /<enclosure[^>]+url="([^"]+)"/i.exec(block);
    if (enc) image = enc[1];
    if (!image) {
      const mediaThumb = /<media:(?:thumbnail|content)[^>]+url="([^"]+)"/i.exec(block);
      if (mediaThumb) image = mediaThumb[1];
    }
    if (!image && description) {
      const imgInDesc = /<img[^>]+src="([^"]+)"/i.exec(description);
      if (imgInDesc) image = imgInDesc[1];
    }
    items.push({
      title: title.replace(/<[^>]+>/g, "").trim(),
      link: link.replace(/<[^>]+>/g, "").trim(),
      description: description ? description.replace(/<[^>]+>/g, "").trim() : undefined,
      image,
      pubDate,
    });
  }
  return items.slice(0, 15);
}

async function fetchRss(url: string): Promise<ParsedItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 PatuakhaliExpressBot/1.0" },
  });
  if (!res.ok) throw new Error(`RSS fetch ${res.status}`);
  const xml = await res.text();
  return parseRss(xml);
}

async function fetchFirecrawlList(url: string): Promise<ParsedItem[]> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

  // Use Firecrawl scrape with JSON extraction to pull list of articles
  const schema = {
    type: "object",
    properties: {
      articles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            image: { type: "string" },
            summary: { type: "string" },
          },
          required: ["title", "url"],
        },
      },
    },
    required: ["articles"],
  };

  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: [
        {
          type: "json",
          schema,
          prompt:
            "Extract the list of news articles visible on this category page. For each article extract title, full absolute URL, image URL if available, and short summary if visible. Skip ads/navigation.",
        },
      ],
      onlyMainContent: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);

  const articles =
    data?.data?.json?.articles ?? data?.json?.articles ?? data?.data?.articles ?? [];
  return (articles as any[]).slice(0, 15).map((a) => ({
    title: a.title,
    link: a.url,
    image: a.image,
    description: a.summary,
  }));
}

async function fetchFirecrawlContent(url: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data?.data?.markdown ?? data?.markdown ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: configs, error: cfgErr } = await supabase
      .from("scraper_configs")
      .select("id,url,method,category_id,source_id,interval_minutes,last_run_at")
      .eq("is_active", true);
    if (cfgErr) throw cfgErr;

    const now = Date.now();
    const due = (configs ?? []).filter((c: ScraperRow) => {
      if (!c.last_run_at) return true;
      const elapsed = (now - new Date(c.last_run_at).getTime()) / 60000;
      return elapsed >= c.interval_minutes;
    });

    let inserted = 0;
    for (const cfg of due) {
      try {
        let items: ParsedItem[] = [];
        if (cfg.method === "rss") {
          items = await fetchRss(cfg.url);
        } else {
          items = await fetchFirecrawlList(cfg.url);
        }

        for (const item of items) {
          if (!item.title || !item.link) continue;

          // Dedupe by source_url
          const { data: existing } = await supabase
            .from("posts")
            .select("id")
            .eq("source_url", item.link)
            .maybeSingle();
          if (existing) continue;

          // Optionally fetch full article content (Firecrawl) for ~50% display
          let content: string | null = item.description ?? null;
          if (cfg.method === "firecrawl") {
            const md = await fetchFirecrawlContent(item.link);
            if (md) content = md;
          }

          const slug = `${slugify(item.title)}-${Math.random().toString(36).slice(2, 7)}`;
          const published = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

          const { error: insErr } = await supabase.from("posts").insert({
            title: item.title,
            slug,
            excerpt: item.description?.slice(0, 280) ?? null,
            content,
            image_url: item.image ?? null,
            source_url: item.link,
            category_id: cfg.category_id,
            source_id: cfg.source_id,
            post_type: "auto",
            is_published: true,
            published_at: published,
          });
          if (!insErr) inserted++;
        }

        await supabase
          .from("scraper_configs")
          .update({ last_run_at: new Date().toISOString(), last_error: null })
          .eq("id", cfg.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase
          .from("scraper_configs")
          .update({ last_run_at: new Date().toISOString(), last_error: msg })
          .eq("id", cfg.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: due.length, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("run-scrapers error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
