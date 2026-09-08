// Per-route metadata. React 19 hoists <title>/<meta>/<link> rendered here into
// <head> and de-dupes against the static defaults in index.html, so no head-manager
// dependency (react-helmet etc.) is needed.

export const SITE_URL = "https://pollbuzz.suryansh.lol";

interface SeoProps {
  title: string;
  description: string;
  /** Route path beginning with "/", used to build the canonical URL. */
  path: string;
  /** Set true for ephemeral/private pages that should stay out of search results. */
  noindex?: boolean;
}

export default function Seo({ title, description, path, noindex = false }: SeoProps) {
  const canonical = `${SITE_URL}${path === "/" ? "" : path}`;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
}
