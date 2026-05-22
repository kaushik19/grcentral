/** Escape user-controlled text before inserting into HTML contexts. */
export function htmlEscape(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const SAFE_PROTOCOLS = /^https?:\/\//i

/** Allow only http/https URLs; return '#' for anything else. */
export function safeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    if (!SAFE_PROTOCOLS.test(u.href)) return '#'
    return u.href
      .replace(/&/g, '&amp;')
      .replace(/"/g, '%22')
      .replace(/'/g, '%27')
      .replace(/</g, '%3C')
      .replace(/>/g, '%3E')
  } catch {
    return '#'
  }
}

/** Canonicalise a user-typed URL: strip invisible chars, add https:// if missing. */
export function canonicaliseUrl(raw: string): string {
  // Strip zero-width / invisible Unicode chars and surrounding whitespace
  let s = raw.replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200D\uFEFF]/g, '').trim()
  if (!s) return ''
  if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//i.test(s)) s = 'https://' + s
  return s
}
