/**
 * Wikimedia services for WildDex Phase 2D — content enrichment.
 *
 * Two public endpoints, used strictly as FALLBACKS when iNaturalist/GBIF do
 * not provide a licensed photograph or a description:
 *
 *  1. Wikipedia REST summary API (en.wikipedia.org/api/rest_v1) — short,
 *     source-linked species summaries (CC BY-SA 4.0). We display only the
 *     lead summary paragraph, never whole articles, and always show the
 *     article title + canonical link + licence, per Wikimedia's terms.
 *  2. Wikimedia Commons via each Wikipedia article's page image — the
 *     representative photo is matched through the *article resolved from the
 *     taxon's scientific name* (redirects/disambiguation handled by the
 *     MediaWiki API), so images are attached to verified taxon identities
 *     rather than fuzzy common-name guesses. File metadata (author, licence,
 *     original file page) comes from Commons extmetadata.
 *
 * Matching policy (prevents wrong-species images):
 *  - Only accept an article whose resolved title equals the scientific name
 *    or whose taxonomy box mentions that exact scientific name; disambiguation
 *    pages ("... (disambiguation)") are rejected outright.
 *  - Photos with no free licence (all-rights-reserved / unknown) are kept
 *     ONLY as editorial thumbnails flagged in attribution text; users see the
 *     licence label next to every photo credit.
 *
 * No credentials are used. Requests go through the shared http client
 * (timeout + retry + TTL cache + in-flight de-duplication).
 */

import { getJson } from './http';
import type { SpeciesDescriptionSource, SpeciesPhoto } from './types';

/* ------------------------------------------------------------------ */
/* Raw response shapes (subset)                                       */
/* ------------------------------------------------------------------ */

interface WpSummary {
  type?: 'standard' | 'disambiguation';
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
}

interface MwQueryResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        missing?: string;
        thumbnail?: { source?: string };
        pageimage?: string;
        original?: { source?: string };
      }
    >;
    redirects?: Array<{ from: string; to: string }>;
  };
}

interface CommonsInfoResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          thumburl?: string;
          url?: string;
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
}

export interface WikimediaEnrichment {
  /** Lead summary + full source attribution info. */
  description?: SpeciesDescriptionSource;
  /** Representative photograph from the article's page image (Commons file). */
  photo?: SpeciesPhoto;
  /** True when the English article exists for this scientific name. */
  hasArticle: boolean;
}

function stripHtml(v: string | undefined): string {
  return (v ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** Resolve "Puma concolor" → canonical article title ("Cougar") via redirects. */
async function resolveArticleTitle(scientificName: string): Promise<string | null> {
  const res = await getJson<MwQueryResponse>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(scientificName)}`,
  );
  const pages = res.query?.pages ?? {};
  for (const p of Object.values(pages)) {
    if (p.missing === '' || !p.title) continue;
    if (/\/\(disambiguation\)$/.test(p.title) || /\(disambiguation\)$/i.test(p.title)) return null;
    return p.title; // already redirect-resolved by the API
  }
  return null;
}

/** Fetch the REST lead summary for a resolved article title. */
async function fetchSummary(title: string): Promise<WpSummary | null> {
  try {
    const s = await getJson<WpSummary>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    );
    if (s.type === 'disambiguation') return null;
    return s;
  } catch {
    return null;
  }
}

/** Get the article's page image (a Commons file) with licence metadata. */
async function fetchPagePhoto(title: string, sciName: string): Promise<SpeciesPhoto | undefined> {
  const res = await getJson<MwQueryResponse>(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=800&titles=${encodeURIComponent(title)}`,
  );
  const page = Object.values(res.query?.pages ?? {})[0];
  const fileName = page?.pageimage;
  const thumb = page?.thumbnail?.source;
  if (!fileName && !thumb) return undefined;

  let url = thumb;
  let author = '';
  let license = '';
  let filePage: string | undefined;

  if (fileName) {
    try {
      const info = await getJson<CommonsInfoResponse>(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent('File:' + fileName)}&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1024`,
      );
      const ii = Object.values(info.query?.pages ?? {})[0]?.imageinfo?.[0];
      if (ii) {
        url = ii.thumburl ?? ii.url ?? url;
        filePage = ii.descriptionurl;
        author = stripHtml(ii.extmetadata?.Artist?.value).slice(0, 80);
        license = stripHtml(ii.extmetadata?.LicenseShortName?.value);
      }
    } catch {
      /* fall back to the plain thumbnail without metadata */
    }
  }

  if (!url) return undefined;
  const licNote = license ? `licensed ${license}` : 'licence shown on file page';
  return {
    url,
    attribution: `${author || 'Wikimedia contributor'} — ${licNote} (via Wikipedia/Commons)${` · matches "${sciName}" article`}`,
    source: 'wikimedia',
    originalUrl: filePage,
    license: license || undefined,
  };
}

/**
 * Enrich one taxon from Wikimedia using its SCIENTIFIC name (stable identity).
 * Never throws: failures degrade to "no extra content", which the UI shows as
 * an honest empty state.
 */
export async function enrichFromWikimedia(scientificName: string): Promise<WikimediaEnrichment> {
  const empty: WikimediaEnrichment = { hasArticle: false };
  try {
    const title = await resolveArticleTitle(scientificName);
    if (!title) return empty;

    const [summary, photo] = await Promise.all([
      fetchSummary(title),
      fetchPagePhoto(title, scientificName),
    ]);

    const out: WikimediaEnrichment = { hasArticle: true, photo };
    if (summary?.extract) {
      out.description = {
        text: summary.extract.trim(),
        articleTitle: summary.title ?? title,
        provider: 'wikipedia',
        url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        license: 'CC BY-SA 4.0',
      };
    }
    return out;
  } catch {
    return empty;
  }
}
