import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Fetch URL metadata (title, description, favicon)
export async function fetchUrlMetadata(url) {
  try {
    const res = await fetch(url)
    const html = await res.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent ||
      ''

    const description =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      ''

    const origin = new URL(url).origin
    const favicon =
      doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
      '/favicon.ico'

    const faviconUrl = favicon.startsWith('http') ? favicon : `${origin}${favicon}`

    return {
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 200),
      favicon: faviconUrl,
    }
  } catch {
    return { title: '', description: '', favicon: '' }
  }
}
