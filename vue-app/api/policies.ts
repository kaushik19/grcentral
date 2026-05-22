/**
 * /api/policies  — Vercel serverless function
 *
 * GET    → list all policy blobs
 * POST   → upload a new policy (multipart/form-data: file, policyId, title, …)
 * DELETE → delete a policy blob { url }
 *
 * Requires env: BLOB_READ_WRITE_TOKEN (Vercel Blob)
 */
import { put, del, list } from '@vercel/blob'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ---------- GET ----------
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'policies/' })
      return res.status(200).json({ blobs })
    } catch (err) {
      return res.status(503).json({ error: 'Blob store unavailable', detail: String(err) })
    }
  }

  // ---------- POST ----------
  if (req.method === 'POST') {
    // Vercel serverless automatically parses multipart with formidable-like API
    // but in Vercel Edge / Node we read the raw body via a small helper.
    try {
      const chunks: Buffer[] = []
      for await (const chunk of req as AsyncIterable<Buffer>) chunks.push(chunk)
      const body   = Buffer.concat(chunks)
      const ct     = req.headers['content-type'] ?? ''
      const boundary = ct.match(/boundary=([^\s;]+)/)?.[1]

      if (!boundary) return res.status(400).json({ error: 'Missing boundary' })

      const { file, fields } = parseMultipart(body, boundary)
      if (!file) return res.status(400).json({ error: 'No file found in request' })

      const policyId = fields.policyId ?? `pol-${Date.now().toString(36)}`
      const ext      = file.filename?.split('.').pop() ?? 'bin'
      const pathname = `policies/${policyId}.${ext}`

      const blob = await put(pathname, file.buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: file.contentType ?? 'application/octet-stream',
        metadata: {
          policyId,
          title:       fields.title       ?? 'Untitled',
          version:     fields.version     ?? '1.0',
          status:      fields.status      ?? 'published',
          format:      fields.format      ?? 'text',
          description: fields.description ?? '',
          tags:        fields.tags        ?? '[]',
          uploadedBy:  fields.uploadedBy  ?? 'unknown',
        },
      })

      return res.status(200).json({ url: blob.url, pathname: blob.pathname })
    } catch (err) {
      return res.status(500).json({ error: 'Upload failed', detail: String(err) })
    }
  }

  // ---------- DELETE ----------
  if (req.method === 'DELETE') {
    try {
      const body = JSON.parse(
        Buffer.concat(await collectBody(req as any)).toString(),
      )
      if (!body.url) return res.status(400).json({ error: 'url required' })
      await del(body.url)
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: 'Delete failed', detail: String(err) })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ---- minimal multipart parser (no extra deps) ----------------------------

interface ParsedFile {
  buffer:      Buffer
  filename:    string
  contentType: string
}

function parseMultipart(
  body: Buffer,
  boundary: string,
): { file: ParsedFile | null; fields: Record<string, string> } {
  const sep   = Buffer.from(`--${boundary}`)
  const parts = splitBuffer(body, sep).slice(1).filter(p => p.length > 4)
  let file: ParsedFile | null = null
  const fields: Record<string, string> = {}

  for (const part of parts) {
    const headerEnd = indexOfCRLF2(part)
    if (headerEnd < 0) continue
    const headers = part.slice(0, headerEnd).toString()
    const data    = part.slice(headerEnd + 4)

    const nameMatch     = headers.match(/name="([^"]+)"/)
    const filenameMatch = headers.match(/filename="([^"]+)"/)
    const ctMatch       = headers.match(/Content-Type:\s*([^\r\n]+)/)

    if (!nameMatch) continue
    const name = nameMatch[1]

    if (filenameMatch) {
      file = {
        buffer:      trimTrailingCRLF(data),
        filename:    filenameMatch[1],
        contentType: ctMatch?.[1]?.trim() ?? 'application/octet-stream',
      }
    } else {
      fields[name] = trimTrailingCRLF(data).toString()
    }
  }
  return { file, fields }
}

function splitBuffer(buf: Buffer, sep: Buffer): Buffer[] {
  const parts: Buffer[] = []
  let start = 0
  while (start < buf.length) {
    const idx = buf.indexOf(sep, start)
    if (idx < 0) { parts.push(buf.slice(start)); break }
    parts.push(buf.slice(start, idx))
    start = idx + sep.length
  }
  return parts
}

function indexOfCRLF2(buf: Buffer): number {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 13 && buf[i+1] === 10 && buf[i+2] === 13 && buf[i+3] === 10) return i
  }
  return -1
}

function trimTrailingCRLF(buf: Buffer): Buffer {
  let end = buf.length
  while (end > 0 && (buf[end - 1] === 10 || buf[end - 1] === 13)) end--
  return buf.slice(0, end)
}

async function collectBody(req: { [Symbol.asyncIterator](): AsyncIterator<Buffer> }): Promise<Buffer[]> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk)
  return chunks
}
