import { useEffect } from "react";

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string) || "https://organic-shop-two.vercel.app").replace(/\/+$/, "");
export const SITE_NAME = "Organic Shop";

export type SeoProps = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
};

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function removeMeta(attribute: "name" | "property", key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export function useSeo({ title, description, canonicalPath, image }: SeoProps) {
  useEffect(() => {
    const canonical = new URL(canonicalPath, SITE_URL).toString();
    const imageUrl = image ? new URL(image, SITE_URL).toString() : "";
    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", "index, follow, max-image-preview:large");
    setMeta("name", "googlebot", "index, follow, max-image-preview:large");
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (imageUrl) {
      setMeta("property", "og:image", imageUrl);
      setMeta("name", "twitter:image", imageUrl);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }
    setCanonical(canonical);
  }, [title, description, canonicalPath, image]);
}

export function Seo(props: SeoProps) {
  useSeo(props);
  return null;
}
