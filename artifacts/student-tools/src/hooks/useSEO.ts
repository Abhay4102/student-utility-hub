import { useEffect } from "react";
import { useLocation } from "wouter";
import { getSeo, SITE_NAME, SITE_URL, type SeoEntry, type FaqItem } from "@/lib/seo";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector(
    `meta[${attr}="${name}"]`,
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

const MANAGED_JSONLD_ID = "treo-managed-jsonld";

function setJsonLd(blocks: object[]) {
  document.querySelectorAll(`script[data-treo-jsonld="1"]`).forEach((s) => s.remove());
  for (const block of blocks) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-treo-jsonld", "1");
    s.id = MANAGED_JSONLD_ID;
    s.textContent = JSON.stringify(block);
    document.head.appendChild(s);
  }
}

function buildBreadcrumb(pathname: string, title: string) {
  const url = SITE_URL + (pathname === "/" ? "" : pathname);
  const items: Array<{ "@type": "ListItem"; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
  ];
  if (pathname !== "/") {
    items.push({ "@type": "ListItem", position: 2, name: title, item: url });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function buildFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function buildAppSchema(pathname: string, title: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    url: SITE_URL + pathname,
    description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any (browser-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL + "/" },
  };
}

export function useSEO(overrides?: Partial<SeoEntry>) {
  const [pathname] = useLocation();

  useEffect(() => {
    const base = getSeo(pathname);
    const seo: SeoEntry = { ...base, ...(overrides || {}) };

    document.title = seo.title;
    setMeta("description", seo.description);
    if (seo.keywords) setMeta("keywords", seo.keywords);

    const canonical = SITE_URL + (pathname === "/" ? "/" : pathname);
    setCanonical(canonical);

    setMeta("og:title", seo.title, "property");
    setMeta("og:description", seo.description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:image", `${SITE_URL}/opengraph.jpg`, "property");

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", seo.title);
    setMeta("twitter:description", seo.description);
    setMeta("twitter:image", `${SITE_URL}/opengraph.jpg`);

    const blocks: object[] = [buildBreadcrumb(pathname, seo.title)];
    if (pathname !== "/") {
      blocks.push(buildAppSchema(pathname, seo.title, seo.description));
    }
    if (seo.faqs && seo.faqs.length > 0) {
      blocks.push(buildFaqSchema(seo.faqs));
    }
    setJsonLd(blocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, JSON.stringify(overrides || {})]);
}
