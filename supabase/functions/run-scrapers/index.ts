// run-scrapers — RSS + Firecrawl ingestion with full-content + image fallback + division mapping
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

// Map URL host hints → division slug (so risingbd/divisions/dhaka → dhaka)
const URL_DIVISION_HINTS: Record<string, string> = {
  dhaka: "dhaka",
  chattogram: "chattogram",
  chittagong: "chattogram",
  cttgram: "chattogram",
  barishal: "barishal",
  barisal: "barishal",
  brisal: "barishal",
  khulna: "khulna",
  rajshahi: "rajshahi",
  rajsahee: "rajshahi",
  sylhet: "sylhet",
  silet: "sylhet",
  rangpur: "rangpur",
  rngpur: "rangpur",
  mymensingh: "mymensingh",
  mzmnsingh: "mymensingh",
};

function detectDivisionSlug(url: string): string | null {
  const lower = url.toLowerCase();
  for (const [hint, slug] of Object.entries(URL_DIVISION_HINTS)) {
    if (lower.includes(`/${hint}`)) return slug;
  }
  return null;
}

// ---------- RSS ----------
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
    const contentEncoded = get("content:encoded");
    let image: string | undefined;
    const enc = /<enclosure[^>]+url="([^"]+)"/i.exec(block);
    if (enc) image = enc[1];
    if (!image) {
      const mediaThumb = /<media:(?:thumbnail|content)[^>]+url="([^"]+)"/i.exec(block);
      if (mediaThumb) image = mediaThumb[1];
    }
    const haystack = `${contentEncoded ?? ""} ${description ?? ""}`;
    if (!image) {
      const imgInDesc = /<img[^>]+src="([^"]+)"/i.exec(haystack);
      if (imgInDesc) image = imgInDesc[1];
    }
    items.push({
      title: title.replace(/<[^>]+>/g, "").trim(),
      link: link.replace(/<[^>]+>/g, "").trim(),
      description: description ? description.replace(/<[^>]+>/g, "").trim() : undefined,
      image,
      pubDate,
      content: contentEncoded?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
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

// ---------- Firecrawl ----------
async function fetchFirecrawlList(url: string): Promise<ParsedItem[]> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");

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
            "Extract list of news articles on this page. For each: title, full absolute URL, primary image URL (must be a real image URL, not data URI), short summary if visible. Skip ads, navigation, and section headers.",
        },
      ],
      onlyMainContent: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);

  const articles =
    data?.data?.json?.articles ?? data?.json?.articles ?? data?.data?.articles ?? [];
  return (articles as any[]).slice(0, 12).map((a) => ({
    title: a.title,
    link: a.url,
    image: a.image,
    description: a.summary,
  }));
}

// Fetch full article: returns { content, image } from a single Firecrawl call
async function fetchFirecrawlArticle(
  url: string
): Promise<{ content: string | null; image: string | null }> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return { content: null, image: null };
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
    if (!res.ok) return { content: null, image: null };
    const md: string | null = data?.data?.markdown ?? data?.markdown ?? null;
    const meta = data?.data?.metadata ?? data?.metadata ?? {};
    let image: string | null =
      meta?.ogImage ?? meta?.["og:image"] ?? meta?.twitterImage ?? null;
    // Fallback: first image in markdown
    if (!image && md) {
      const mImg = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/.exec(md);
      if (mImg) image = mImg[1];
    }
    // Strip markdown image syntax + links from content for cleaner text
    const cleaned = md
      ? md
          .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/^\s*#+\s*/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : null;
    return { content: cleaned, image };
  } catch {
    return { content: null, image: null };
  }
}

// ---------- Main ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse body for optional config_id (manual single-run trigger)
    let onlyConfigId: string | null = null;
    let force = false;
    let limit = 8; // process at most N configs per invocation to avoid timeout
    try {
      const body = await req.json();
      if (body?.config_id) onlyConfigId = String(body.config_id);
      if (body?.force) force = true;
      if (typeof body?.limit === "number") limit = Math.max(1, Math.min(20, body.limit));
    } catch {
      // ignore
    }

    let cfgQuery = supabase
      .from("scraper_configs")
      .select("id,url,method,category_id,source_id,interval_minutes,last_run_at")
      .eq("is_active", true)
      .order("last_run_at", { ascending: true, nullsFirst: true });
    if (onlyConfigId) cfgQuery = cfgQuery.eq("id", onlyConfigId);
    const { data: configs, error: cfgErr } = await cfgQuery;
    if (cfgErr) throw cfgErr;

    // Load divisions once for slug→id mapping
    const { data: divs } = await supabase
      .from("divisions")
      .select("id,slug");
    const divMap = new Map<string, string>();
    (divs ?? []).forEach((d: any) => divMap.set(d.slug, d.id));

    const now = Date.now();
    const dueAll = (configs ?? []).filter((c: ScraperRow) => {
      if (force || onlyConfigId) return true;
      if (!c.last_run_at) return true;
      const elapsed = (now - new Date(c.last_run_at).getTime()) / 60000;
      return elapsed >= c.interval_minutes;
    });
    // Process oldest-first, capped at limit
    const due = dueAll.slice(0, limit);

    let inserted = 0;
    const errors: string[] = [];

    for (const cfg of due) {
      try {
        let items: ParsedItem[] = [];
        if (cfg.method === "rss") {
          items = await fetchRss(cfg.url);
        } else {
          items = await fetchFirecrawlList(cfg.url);
        }

        // Detect division from scraper URL (e.g., /divisions/dhaka)
        const divSlug = detectDivisionSlug(cfg.url);
        const divisionId = divSlug ? divMap.get(divSlug) ?? null : null;

        for (const item of items) {
          if (!item.title || !item.link) continue;
          if (!item.link.startsWith("http")) continue;

          // Dedupe by source_url
          const { data: existing } = await supabase
            .from("posts")
            .select("id")
            .eq("source_url", item.link)
            .maybeSingle();
          if (existing) continue;

          // Always fetch full article via Firecrawl for full content + image fallback
          let content: string | null = item.content ?? item.description ?? null;
          let imageUrl: string | null = item.image ?? null;

          const article = await fetchFirecrawlArticle(item.link);
          if (article.content && article.content.length > (content?.length ?? 0)) {
            content = article.content;
          }
          if (!imageUrl && article.image) imageUrl = article.image;

          const slug = `${slugify(item.title)}-${Math.random().toString(36).slice(2, 7)}`;
          const published = item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString();

          const { error: insErr } = await supabase.from("posts").insert({
            title: item.title,
            slug,
            excerpt: (item.description ?? content ?? "").slice(0, 280) || null,
            content,
            image_url: imageUrl,
            source_url: item.link,
            category_id: cfg.category_id,
            source_id: cfg.source_id,
            division_id: divisionId,
            post_type: "auto",
            is_published: true,
            published_at: published,
          });
          if (!insErr) inserted++;
          else console.error("insert error", insErr.message);
        }

        await supabase
          .from("scraper_configs")
          .update({ last_run_at: new Date().toISOString(), last_error: null })
          .eq("id", cfg.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${cfg.url}: ${msg}`);
        await supabase
          .from("scraper_configs")
          .update({ last_run_at: new Date().toISOString(), last_error: msg })
          .eq("id", cfg.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: due.length,
        queued: dueAll.length,
        inserted,
        errors: errors.slice(0, 10),
      }),
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
