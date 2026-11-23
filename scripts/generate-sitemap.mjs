import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from 'vite'

const root = process.cwd()
const env = loadEnv('production', root, '')
const pick = (key) => process.env[key] || env[key]

const rawSiteUrl =
  pick('VITE_SITE_URL') ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL

if (!rawSiteUrl) {
  console.warn(
    '[seo] VITE_SITE_URL is not set; skipped sitemap.xml generation.',
  )
  process.exit(0)
}

const siteUrl = (
  /^https?:\/\//i.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`
).replace(/\/+$/, '')

const supabaseUrl = pick('VITE_SUPABASE_URL')
const supabaseKey = pick('VITE_SUPABASE_PUBLISHABLE_KEY')

async function loadItems() {
  if (!supabaseUrl || !supabaseKey) return []

  try {
    const endpoint = new URL('/rest/v1/items', supabaseUrl)
    endpoint.searchParams.set('select', 'id,updated_at')
    endpoint.searchParams.set('is_available', 'eq.true')
    endpoint.searchParams.set('order', 'updated_at.desc')
    endpoint.searchParams.set('limit', '5000')

    const response = await fetch(endpoint, {
      headers: { apikey: supabaseKey, Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.warn(
      `[seo] Could not load items for sitemap: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    return []
  }
}

function escapeXml(value) {
  return String(value).replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character],
  )
}

function isoDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const items = await loadItems()

const pages = [
  {
    loc: `${siteUrl}/`,
    changefreq: 'daily',
    priority: '1.0',
  },
  {
    loc: `${siteUrl}/download`,
    changefreq: 'monthly',
    priority: '0.7',
  },
  ...items.map((item) => ({
    loc: `${siteUrl}/item/${item.id}`,
    lastmod: isoDate(item.updated_at),
    changefreq: 'weekly',
    priority: '0.8',
  })),
]

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) =>
    [
      '  <url>',
      `    <loc>${escapeXml(page.loc)}</loc>`,
      page.lastmod ? `    <lastmod>${page.lastmod}</lastmod>` : null,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n'),
  ),
  '</urlset>',
  '',
].join('\n')

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  '# Private and account-only areas',
  'Disallow: /admin',
  'Disallow: /account',
  'Disallow: /auth',
  'Disallow: /cart',
  'Disallow: /checkout',
  'Disallow: /order/',
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  '',
].join('\n')

const outputDirectory = path.join(root, 'dist')
await mkdir(outputDirectory, { recursive: true })
await writeFile(path.join(outputDirectory, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(path.join(outputDirectory, 'robots.txt'), robots, 'utf8')

console.log(
  `[seo] Wrote sitemap.xml with ${pages.length} URL${
    pages.length === 1 ? '' : 's'
  } and robots.txt for ${siteUrl}`,
)
