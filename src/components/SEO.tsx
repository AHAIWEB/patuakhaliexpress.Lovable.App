import { Helmet } from "react-helmet-async";

interface Props {
  title: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  canonical?: string;
  noindex?: boolean;
}

import { useSiteSettings } from "@/hooks/useSiteSettings";

const DEFAULT_IMAGE = "/placeholder.svg";

const SEO = ({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  section,
  jsonLd,
  canonical,
  noindex,
}: Props) => {
  const settings = useSiteSettings();
  const SITE_NAME = settings.site_name || "পটুয়াখালী এক্সপ্রেস";
  const fullUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const fullCanonical = canonical ?? fullUrl;
  const ogImage = image || settings.og_image_url || settings.logo_url || DEFAULT_IMAGE;
  const finalTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
  const desc = (description ?? "").slice(0, 160);

  const ldArr = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{finalTitle}</title>
      {desc && <meta name="description" content={desc} />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      {desc && <meta property="og:description" content={desc} />}
      {fullUrl && <meta property="og:url" content={fullUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="bn_BD" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {section && <meta property="article:section" content={section} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      <meta name="twitter:image" content={ogImage} />

      {ldArr.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
