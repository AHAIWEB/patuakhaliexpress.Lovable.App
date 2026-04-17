import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://patuakhaliexpress.lovable.app";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug,title,published_at")
    .eq("is_published", true)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(1000);

  const items = (posts ?? []).map((p) => `
    <url>
      <loc>${esc(`${SITE}/post/${p.slug}`)}</loc>
      <news:news>
        <news:publication>
          <news:name>পটুয়াখালী এক্সপ্রেস</news:name>
          <news:language>bn</news:language>
        </news:publication>
        <news:publication_date>${new Date(p.published_at).toISOString()}</news:publication_date>
        <news:title>${esc(p.title)}</news:title>
      </news:news>
    </url>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=600, s-maxage=600" },
  });
});
