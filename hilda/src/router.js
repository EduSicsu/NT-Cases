import { useEffect, useState } from 'react'

// Tiny hash router. Every screen has a real URL (#/client/item/tomato), so refresh,
// the browser Back button and shared links all work.

let idx = 0
if (typeof window !== 'undefined') {
  idx = (window.history.state && window.history.state.idx) || 0
  if (!window.history.state) window.history.replaceState({ idx: 0 }, '')
}

function parse() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const [path, qs] = raw.split('?')
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) }
}

const notify = () => window.dispatchEvent(new Event('hilda:nav'))

export function go(path, { replace = false } = {}) {
  const url = `#${path}`
  if (window.location.hash === url) return
  if (replace) window.history.replaceState({ idx }, '', url)
  else { idx += 1; window.history.pushState({ idx }, '', url) }
  notify()
}

/** Go back one step; if this page was opened directly, go to `fallback` instead. */
export function back(fallback = '/') {
  if (idx > 0) window.history.back()
  else go(fallback, { replace: true })
}

export function useLocation() {
  const [loc, setLoc] = useState(parse)
  useEffect(() => {
    const on = () => {
      idx = (window.history.state && window.history.state.idx) || 0
      setLoc(parse())
    }
    window.addEventListener('hilda:nav', on)
    window.addEventListener('popstate', on)
    window.addEventListener('hashchange', on)
    return () => {
      window.removeEventListener('hilda:nav', on)
      window.removeEventListener('popstate', on)
      window.removeEventListener('hashchange', on)
    }
  }, [])
  return loc
}

/** Match "/client/item/:id" style patterns. Returns params or null. */
export function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean)
  const b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}
