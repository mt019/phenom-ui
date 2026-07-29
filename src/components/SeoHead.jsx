import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

function setMeta(attribute, key, content) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function removeMeta(attribute, key) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function setLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

/** Keeps route identity, sharing metadata, and schema.org in one place.
 * The JSON-LD describes only visible page content: page identity, the site's
 * own directory (itemList, passed only where those links are on screen), and
 * the publishing organisation. It does not invent FAQs, ratings, or dates. */
export default function SeoHead({ page, itemList, site = {} }) {
  const { pathname } = useLocation();
  const siteUrl = (site.url || import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
  const siteName = site.name || 'Phenom';
  const siteDescription = site.description || '';
  const logo = site.logo || `${siteUrl}/phenom-ring.svg`;
  const defaultImage = site.defaultImage || `${siteUrl}/og-default.png`;
  const language = site.language || 'zh-Hant-TW';
  const locale = site.locale || 'zh_TW';
  const url = `${siteUrl}${pathname === '/' ? '/' : pathname}`;
  const ogImage = page?.image || (pathname === '/' ? defaultImage : null);
  const metadata = useMemo(() => ({
    title: page?.title || siteName,
    description: page?.description || siteDescription,
    type: page?.type || 'WebPage',
    indexable: page?.indexable !== false,
    name: page?.name,
    keywords: page?.keywords,
    parent: page?.parent,
    buildSchema: page?.buildSchema,
  }), [page, siteDescription, siteName]);

  useEffect(() => {
    document.title = metadata.title;
    document.documentElement.lang = language;
    setMeta('name', 'description', metadata.description);
    setMeta('name', 'robots', metadata.indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,nofollow');
    setMeta('property', 'og:type', metadata.type === 'Article' ? 'article' : 'website');
    setMeta('property', 'og:locale', locale);
    setMeta('property', 'og:site_name', siteName);
    setMeta('property', 'og:title', metadata.title);
    setMeta('property', 'og:description', metadata.description);
    setMeta('property', 'og:url', url);
    if (ogImage) {
      setMeta('property', 'og:image', ogImage);
      setMeta('property', 'og:image:type', 'image/png');
      setMeta('property', 'og:image:width', '1200');
      setMeta('property', 'og:image:height', '630');
      setMeta('property', 'og:image:alt', `${metadata.name || metadata.title} — ${siteName}`);
      setMeta('name', 'twitter:image', ogImage);
    } else {
      ['og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt']
        .forEach((key) => removeMeta('property', key));
      removeMeta('name', 'twitter:image');
    }
    setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', metadata.title);
    setMeta('name', 'twitter:description', metadata.description);
    // Set-or-remove, never just set: under SPA navigation the previous page's
    // keywords would otherwise linger on pages that declare none.
    if (metadata.keywords) setMeta('name', 'keywords', metadata.keywords);
    else removeMeta('name', 'keywords');
    setLink('canonical', url);

    const isArticle = metadata.type === 'Article';
    const primary = {
      '@type': metadata.type,
      '@id': `${url}#webpage`,
      url,
      name: metadata.title,
      description: metadata.description,
      inLanguage: language,
      isPartOf: { '@id': `${siteUrl}/#website` },
      ...(ogImage ? { primaryImageOfPage: ogImage } : {}),
      ...(isArticle ? {
        headline: metadata.name || metadata.title,
        ...(ogImage ? { image: ogImage } : {}),
        author: { '@id': `${siteUrl}/#org` },
        publisher: { '@id': `${siteUrl}/#org` },
        mainEntityOfPage: url,
      } : {}),
    };

    const graph = [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#org`,
        name: siteName,
        url: `${siteUrl}/`,
        logo: { '@type': 'ImageObject', url: logo },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        inLanguage: language,
        description: siteDescription,
        publisher: { '@id': `${siteUrl}/#org` },
      },
      primary,
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: siteName, item: `${siteUrl}/` },
        // Optional middle crumb: a tab page sits under its section (e.g. the
        // Constitutional Court archive) rather than directly under the site.
        ...(metadata.parent ? [{ '@type': 'ListItem', position: 2, name: metadata.parent.name, item: `${siteUrl}${metadata.parent.path}` }] : []),
        ...(pathname === '/' ? [] : [{ '@type': 'ListItem', position: metadata.parent ? 3 : 2, name: metadata.name || metadata.title, item: url }]),
      ] },
    ];

    // Page-supplied extra schema nodes (e.g. the archive Dataset). The function
    // receives the resolved origin and page URL so it can emit absolute @ids.
    if (typeof metadata.buildSchema === 'function') {
      const extra = metadata.buildSchema(siteUrl, url);
      if (Array.isArray(extra)) graph.push(...extra);
    }

    // Only emit an ItemList when the caller hands one in — it mirrors a list of
    // links actually rendered on the page (the homepage directory), never a
    // synthesised one.
    if (Array.isArray(itemList) && itemList.length) {
      graph.push({
        '@type': 'ItemList',
        '@id': `${url}#directory`,
        name: metadata.title,
        numberOfItems: itemList.length,
        itemListElement: itemList.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          description: it.description,
          url: `${siteUrl}${it.path}`,
        })),
      });
    }

    let script = document.head.querySelector('script[data-seo-schema]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  }, [
    defaultImage,
    itemList,
    language,
    locale,
    logo,
    metadata,
    ogImage,
    pathname,
    siteDescription,
    siteName,
    siteUrl,
    url,
  ]);

  return null;
}
