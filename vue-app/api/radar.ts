/**
 * /api/radar  — Vercel serverless function
 *
 * Polls real regulatory sources:
 *   - EUR-Lex SPARQL/RSS for recent OJ publications
 *   - NIST CSRC Publications API
 *   - CISA Advisories RSS
 *   - EDPB News RSS
 *
 * Returns a list of detected regulatory changes, newest first.
 * Results are cached server-side for 1 hour (Vercel edge cache headers).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface RadarChange {
  id:             string
  frameworkId:    string
  frameworkTitle: string
  summary:        string
  impact:         'critical' | 'high' | 'medium' | 'low' | 'info'
  detectedAt:     string
  sourceUrl:      string
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const [eurLex, nist, cisa, edpb] = await Promise.allSettled([
      pollEurLex(),
      pollNist(),
      pollCisa(),
      pollEdpb(),
    ])

    const changes: RadarChange[] = [
      ...(eurLex.status  === 'fulfilled' ? eurLex.value  : []),
      ...(nist.status    === 'fulfilled' ? nist.value    : []),
      ...(cisa.status    === 'fulfilled' ? cisa.value    : []),
      ...(edpb.status    === 'fulfilled' ? edpb.value    : []),
    ].sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')
    return res.status(200).json({ changes, fetchedAt: new Date().toISOString() })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}

// ---- EUR-Lex: recent OJ publications via RSS ---------------------------
async function pollEurLex(): Promise<RadarChange[]> {
  const url = 'https://eur-lex.europa.eu/RSSFD/fr/search-result.rss?query=SELECT%20*%20WHERE%20%7B%3Fexpr%20cdm%3Awork_has_resource-type%20op-authority%3Aresource-type%2FOJL.%7D%20ORDER%20BY%20DESC%28%3FnotificationDate%29&page=1&pageSize=5&output=application%2Frss%2Bxml'

  const r = await fetch(url, { headers: { 'User-Agent': 'GRCentral/1.0' }, signal: AbortSignal.timeout(8000) })
  if (!r.ok) return []

  const xml = await r.text()
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]

  return items.slice(0, 5).map((m, i) => {
    const title     = stripTags(m[1].match(/<title>(.*?)<\/title>/)?.[1] ?? '')
    const link      = stripTags(m[1].match(/<link>(.*?)<\/link>/)?.[1] ?? '')
    const pubDate   = m[1].match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString()
    const isGdpr    = /gdpr|data protection|personal data/i.test(title)
    const isAI      = /artificial intelligence|ai act/i.test(title)
    const isNis     = /nis|cybersecurity|network/i.test(title)
    const frameworkId = isGdpr ? 'gdpr' : isAI ? 'ai-act' : isNis ? 'nis2' : 'nis2'
    return {
      id:             `eurlex-${i}-${Date.now()}`,
      frameworkId,
      frameworkTitle: isGdpr ? 'GDPR' : isAI ? 'AI Act' : isNis ? 'NIS2' : 'EU Regulation',
      summary:        title || 'New Official Journal publication detected',
      impact:         'medium' as const,
      detectedAt:     new Date(pubDate).toISOString(),
      sourceUrl:      link,
    }
  })
}

// ---- NIST CSRC Publications API ----------------------------------------
async function pollNist(): Promise<RadarChange[]> {
  const url = 'https://csrc.nist.gov/publications/search?keywords-lg=cybersecurity&sortBy=releaseDate&resultsPerPage=5'
  const r = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'GRCentral/1.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) return []
  const json = await r.json().catch(() => null)
  if (!json) return []

  const pubs: Array<{ title: string; abstract: string; doi?: string; releaseDate: string }> =
    json.publications ?? json.results ?? []

  return pubs.slice(0, 3).map((p, i) => ({
    id:             `nist-${i}-${Date.now()}`,
    frameworkId:    'nist-csf',
    frameworkTitle: 'NIST CSF 2.0',
    summary:        p.title ?? 'New NIST publication',
    impact:         'medium' as const,
    detectedAt:     new Date(p.releaseDate ?? Date.now()).toISOString(),
    sourceUrl:      p.doi ?? 'https://www.nist.gov/cyberframework',
  }))
}

// ---- CISA Advisories RSS -----------------------------------------------
async function pollCisa(): Promise<RadarChange[]> {
  const url = 'https://www.cisa.gov/uscert/ncas/alerts.xml'
  const r = await fetch(url, { headers: { 'User-Agent': 'GRCentral/1.0' }, signal: AbortSignal.timeout(8000) })
  if (!r.ok) return []
  const xml = await r.text()
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]

  return items.slice(0, 3).map((m, i) => {
    const title   = stripTags(m[1].match(/<title>(.*?)<\/title>/)?.[1] ?? '')
    const link    = stripTags(m[1].match(/<link>(.*?)<\/link>/)?.[1] ?? '')
    const pubDate = m[1].match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString()
    return {
      id:             `cisa-${i}-${Date.now()}`,
      frameworkId:    'nist-csf',
      frameworkTitle: 'NIST CSF / CISA',
      summary:        title || 'New CISA advisory',
      impact:         'high' as const,
      detectedAt:     new Date(pubDate).toISOString(),
      sourceUrl:      link,
    }
  })
}

// ---- EDPB News RSS -----------------------------------------------------
async function pollEdpb(): Promise<RadarChange[]> {
  const url = 'https://www.edpb.europa.eu/rss.xml'
  const r = await fetch(url, { headers: { 'User-Agent': 'GRCentral/1.0' }, signal: AbortSignal.timeout(8000) })
  if (!r.ok) return []
  const xml = await r.text()
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]

  return items.slice(0, 3).map((m, i) => {
    const title   = stripTags(m[1].match(/<title>(.*?)<\/title>/)?.[1] ?? '')
    const link    = stripTags(m[1].match(/<link>(.*?)<\/link>/)?.[1] ?? '')
    const pubDate = m[1].match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? new Date().toISOString()
    return {
      id:             `edpb-${i}-${Date.now()}`,
      frameworkId:    'gdpr',
      frameworkTitle: 'GDPR / EDPB',
      summary:        title || 'New EDPB publication',
      impact:         'medium' as const,
      detectedAt:     new Date(pubDate).toISOString(),
      sourceUrl:      link,
    }
  })
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()
}
