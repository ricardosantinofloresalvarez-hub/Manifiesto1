export const SITE_ORIGIN = "https://manifiesto.app";

export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/planes",
  "/about.html",
  "/terms-of-service.html",
  "/privacy-policy.html",
  "/refund-policy.html",
] as const;

type SeoMetadata = {
  title: string;
  description: string;
  canonical?: string;
  robots: "index,follow" | "noindex,nofollow";
  jsonLd?: Record<string, unknown>[];
};

const institutionalDescription =
  "Manifiesto ofrece respaldo digital de tu equipaje: fotos, inventario y un certificado con QR para tener cómo mostrar lo que llevabas. No es un documento oficial ni una certificación de aerolínea.";

const publicSeo: Record<string, SeoMetadata> = {
  "/": {
    title: "Manifiesto — Respaldo digital de tu equipaje",
    description: institutionalDescription,
    canonical: `${SITE_ORIGIN}/`,
    robots: "index,follow",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Manifiesto",
        url: `${SITE_ORIGIN}/`,
        logo: `${SITE_ORIGIN}/Manifiesto_logo_jpg.png`,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Manifiesto",
        url: `${SITE_ORIGIN}/`,
        inLanguage: "es",
      },
    ],
  },
  "/planes": {
    title: "Precios y planes | Manifiesto",
    description:
      "Consulta los planes de Manifiesto para organizar tu equipaje con fotos, inventario y un certificado con QR como respaldo personal, no oficial.",
    canonical: `${SITE_ORIGIN}/planes`,
    robots: "index,follow",
  },
  "/about.html": {
    title: "Ayuda e información | Manifiesto",
    description:
      "Conoce Manifiesto y cómo organizar fotos e inventarios de equipaje con un certificado con QR como respaldo digital personal.",
    canonical: `${SITE_ORIGIN}/about.html`,
    robots: "index,follow",
  },
  "/terms-of-service.html": {
    title: "Términos de uso | Manifiesto",
    description:
      "Consulta los términos de uso de Manifiesto, la herramienta personal para organizar información de viajes y equipaje.",
    canonical: `${SITE_ORIGIN}/terms-of-service.html`,
    robots: "index,follow",
  },
  "/privacy-policy.html": {
    title: "Política de privacidad | Manifiesto",
    description:
      "Consulta cómo Manifiesto trata y protege la información que compartes al organizar viajes y equipaje.",
    canonical: `${SITE_ORIGIN}/privacy-policy.html`,
    robots: "index,follow",
  },
  "/refund-policy.html": {
    title: "Política de reembolso | Manifiesto",
    description:
      "Consulta las condiciones y el proceso para solicitar un reembolso de una compra en Manifiesto.",
    canonical: `${SITE_ORIGIN}/refund-policy.html`,
    robots: "index,follow",
  },
};

const privateSeo: SeoMetadata = {
  title: "Manifiesto",
  description: institutionalDescription,
  robots: "noindex,nofollow",
};

const privateExactPaths = new Set([
  "/login",
  "/dashboard",
  "/manifests",
  "/profile",
  "/admin",
  "/auth/callback",
  "/verify",
]);

export function getSeoMetadata(pathname: string): SeoMetadata {
  const normalizedPath =
    pathname === "/index.html" ? "/" : pathname.replace(/\/+$/, "") || "/";
  const publicMetadata = publicSeo[normalizedPath];
  if (publicMetadata) return publicMetadata;

  if (
    privateExactPaths.has(normalizedPath) ||
    /^\/(trip|found|label)(\/|$)/.test(normalizedPath)
  ) {
    if (normalizedPath === "/verify") {
      return {
        ...privateSeo,
        title: "Verificación de certificado | Manifiesto",
      };
    }
    return privateSeo;
  }

  return {
    ...privateSeo,
    title: "Página no encontrada | Manifiesto",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSeoHead(metadata: SeoMetadata): string {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonical = metadata.canonical
    ? `<link id="seo-canonical" rel="canonical" href="${escapeHtml(metadata.canonical)}" />`
    : "";
  const jsonLd = metadata.jsonLd
    ? `<script id="seo-jsonld" type="application/ld+json">${JSON.stringify(metadata.jsonLd)}</script>`
    : "";

  return [
    `<title id="seo-title">${title}</title>`,
    `<meta id="seo-description" name="description" content="${description}" />`,
    `<meta id="seo-robots" name="robots" content="${metadata.robots}" />`,
    canonical,
    `<meta id="seo-og-title" property="og:title" content="${title}" />`,
    `<meta id="seo-og-description" property="og:description" content="${description}" />`,
    `<meta id="seo-og-type" property="og:type" content="website" />`,
    `<meta id="seo-og-url" property="og:url" content="${escapeHtml(metadata.canonical || SITE_ORIGIN)}" />`,
    `<meta id="seo-og-image" property="og:image" content="${SITE_ORIGIN}/Manifiesto_logo_jpg.png" />`,
    `<meta id="seo-og-locale" property="og:locale" content="es_MX" />`,
    `<meta id="seo-twitter-card" name="twitter:card" content="summary_large_image" />`,
    `<meta id="seo-twitter-title" name="twitter:title" content="${title}" />`,
    `<meta id="seo-twitter-description" name="twitter:description" content="${description}" />`,
    `<meta id="seo-twitter-image" name="twitter:image" content="${SITE_ORIGIN}/Manifiesto_logo_jpg.png" />`,
    jsonLd,
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function applySeoToHtml(html: string, pathname: string): string {
  const head = renderSeoHead(getSeoMetadata(pathname));
  return html.replace(
    /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,
    `<!-- SEO_HEAD_START -->\n    ${head}\n    <!-- SEO_HEAD_END -->`,
  );
}
