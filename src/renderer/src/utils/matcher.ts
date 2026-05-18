import Fuse from 'fuse.js'
import type { SearchResult } from '../../../shared/types'

const RE_VERSION_TAG = /[[(][^)\]]*?(?:v[\d.]+|ver[\s.]?[\d.]+|version)[^)\]]*?[\])]/gi
const RE_LANG_TAG = /[[(][A-Za-z]{2,8}[)\]]/g
const RE_SPECIAL_CHARS = /[_ ]+/g
const RE_WHITESPACE = /\s+/g

export function cleanQuery(query: string): string {
  return query
    .replace(RE_VERSION_TAG, '')
    .replace(RE_LANG_TAG, '')
    .replace(RE_SPECIAL_CHARS, ' ')
    .replace(RE_WHITESPACE, ' ')
    .trim()
}

export const AUTO_MATCH_THRESHOLD = 0.35
export const REJECT_THRESHOLD = 0.5

export function pickBestMatch(
  query: string,
  results: SearchResult[],
  threshold = AUTO_MATCH_THRESHOLD
): SearchResult | null {
  const cleaned = cleanQuery(query)
  if (!cleaned || results.length === 0) return null

  if (results.length === 1) return results[0]

  const fuse = new Fuse(results, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'titleCn', weight: 1 }
    ],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    distance: 100
  })

  const scored = fuse.search(cleaned)
  if (scored.length === 0) return null

  const best = scored[0]
  const score = best.score ?? 1

  if (score < threshold) return best.item

  return null
}

export function sortByMatch(query: string, results: SearchResult[]): SearchResult[] {
  const cleaned = cleanQuery(query)
  if (!cleaned || results.length <= 1) return results

  const fuse = new Fuse(results, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'titleCn', weight: 1 }
    ],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    distance: 100
  })

  return fuse.search(cleaned).map((r) => r.item)
}
