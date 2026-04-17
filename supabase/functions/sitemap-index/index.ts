import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://patuakhaliexpress.lovable.app";
const FN_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
const PAGE_SIZE = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const now = new Date().toISOString();

  const sitemaps: string[] = [];
  sitemaps.push(
    `<sitemap><loc>${FN_BASE}/sitemap-static</loc><lastmod>${now}</lastmod></sitemap>`,
  );
  sitemaps.push(
    `<sitemap><loc>${FN_BASE}/sitemap-news</loc><lastmod>${now}</lastmod></sitemap>`,
  );
  for (let i = 1; i <= pages; i++) {
    sitemaps.push(
      `<sitemap><loc>${FN_BASE}/sitemap-posts?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
});
