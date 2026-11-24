import { useEffect } from 'react'
import { getSiteOrigin } from '@/lib/platform'

export const SITE_NAME = 'Tofik Store'
export const SITE_DESCRIPTION =
  'Shop everyday essentials at Tofik Store. Browse products, see live prices and stock, and check out quickly with your phone or email.'

const DEFAULT_IMAGE = '/og-image.png'

export interface SeoOptions {
  title: string
  description?: string
  path?: string
  image?: string | null
  type?: 'website' | 'product'
  noIndex?: boolean
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null
}

/** Absolute site URL, using VITE_SITE_URL when configured. */
export function siteBaseUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  return getSiteOrigin()
}

export function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  const base = siteBaseUrl()
  if (!base) return value
  return new URL(value, `${base}/`).toString()
}

/** Turn arbitrary item descriptions into clean meta descriptions. */
export function metaDescription(
  value: string | null | undefined,
  fallback = SITE_DESCRIPTION,
): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return fallback
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text
}

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  )
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  )
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

function upsertJsonLd(json: string) {
  const existing = document.getElementById('seo-json-ld')
  if (!json) {
    existing?.remove()
    return
  }

  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : document.createElement('script')

  if (!existing) {
    script.id = 'seo-json-ld'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = json
}

export function useSeo({
  title,
  description = SITE_DESCRIPTION,
  path,
  image,
  type = 'website',
  noIndex = false,
  jsonLd,
}: SeoOptions) {
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    if (typeof document === 'undefined') return

    const fullTitle = title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    const descriptionContent = metaDescription(description)
    const canonicalPath =
      path ?? `${window.location.pathname}${window.location.search}`
    const canonicalUrl = absoluteUrl(canonicalPath)
    const imageUrl = absoluteUrl(image?.trim() || DEFAULT_IMAGE)

    document.title = fullTitle

    upsertMeta('name', 'description', descriptionContent)
    upsertMeta(
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )

    upsertLink('canonical', canonicalUrl)

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', descriptionContent)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', imageUrl)
    upsertMeta('property', 'og:image:alt', `${title} — ${SITE_NAME}`)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', descriptionContent)
    upsertMeta('name', 'twitter:image', imageUrl)
    upsertMeta('name', 'twitter:image:alt', `${title} — ${SITE_NAME}`)

    upsertJsonLd(serializedJsonLd)
  }, [
    title,
    description,
    path,
    image,
    type,
    noIndex,
    serializedJsonLd,
  ])
}
