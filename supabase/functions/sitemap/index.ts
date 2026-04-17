import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://patuakhaliexpress.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const [{ data: posts }, { data: cats }, { data: divs }, { data: dists }] = await Promise.all([
    supabase
      .from("posts")
      .select("slug,updated_at,published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5000),
    supabase.from("categories").select("slug,updated_at"),
    supabase.from("divisions").select("slug,updated_at"),
    supabase.from("districts").select("slug,updated_at"),
  ]);

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const urls: string[] = [];
  const add = (loc: string, lastmod?: string, changefreq = "daily", priority = "0.7") => {
    urls.push(
      `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
    );
  };

  add(`${SITE}/`, new Date().toISOString(), "hourly", "1.0");
  add(`${SITE}/gallery`, undefined, "daily", "0.6");
  for (const c of cats ?? []) add(`${SITE}/category/${c.slug}`, c.updated_at, "daily", "0.8");
  for (const d of divs ?? []) add(`${SITE}/division/${d.slug}`, d.updated_at, "daily", "0.7");
  for (const d of dists ?? []) add(`${SITE}/district/${d.slug}`, d.updated_at, "weekly", "0.6");
  for (const p of posts ?? [])
    add(`${SITE}/post/${p.slug}`, p.updated_at ?? p.published_at, "weekly", "0.9");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
