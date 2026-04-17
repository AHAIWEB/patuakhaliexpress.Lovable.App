import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://patuakhaliexpress.lovable.app";
const PAGE_SIZE = 1000;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data: posts } = await supabase
    .from("posts")
    .select("slug,updated_at,published_at,image_url")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .range(from, to);

  const items = (posts ?? []).map((p) => {
    const lastmod = new Date(p.updated_at ?? p.published_at).toISOString();
    const image = p.image_url
      ? `<image:image><image:loc>${esc(p.image_url)}</image:loc></image:image>`
      : "";
    return `<url><loc>${esc(`${SITE}/post/${p.slug}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority>${image}</url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
});
