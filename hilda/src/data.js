// Catalog, pricing helpers and seed data for the Hilda prototype.
// Money is always integer cents (BRL). Weight-priced products keep stock in grams.

export const FARM = { id: 'boa-terra', km: 12 }

export const SIZES = [
  { id: 'S', g: 250, k: 'sizeS' },
  { id: 'M', g: 500, k: 'sizeM' },
  { id: 'L', g: 1000, k: 'sizeL' },
]
export const DEFAULT_SIZE = 'M'

export const FEES = { fair: 0, point: 300, home: 900 }

export const BASE_PRODUCTS = [
  { id: 'lettuce', names: { pt: 'Alface crespa', en: 'Curly lettuce', ar: 'خس مجعد' }, cat: 'leaf', unit: 'un', price: 450, stock: 24, img: 'lettuce', color: '#7FB069' },
  { id: 'tomato', names: { pt: 'Tomate cereja', en: 'Cherry tomato', ar: 'طماطم كرزية' }, cat: 'fruit', unit: 'kg', price: 1200, stock: 18000, img: 'tomato', color: '#D64541' },
  { id: 'cassava', names: { pt: 'Mandioca', en: 'Cassava', ar: 'الكسافا' }, cat: 'root', unit: 'kg', price: 700, stock: 12000, img: 'cassava', color: '#B8925A' },
  { id: 'herbs', names: { pt: 'Cheiro-verde', en: 'Fresh herbs', ar: 'أعشاب طازجة' }, cat: 'leaf', unit: 'bunch', price: 300, stock: 40, img: 'herbs', color: '#3F7D4A' },
  { id: 'jambu', names: { pt: 'Jambu', en: 'Jambu', ar: 'جامبو' }, cat: 'leaf', unit: 'bunch', price: 500, stock: 0, img: null, color: '#6B8E3A' },
]

export const CATEGORIES = [
  { id: 'all', k: 'catAll' },
  { id: 'leaf', k: 'catLeaf' },
  { id: 'root', k: 'catRoot' },
  { id: 'fruit', k: 'catFruit' },
]

// --- product helpers -------------------------------------------------------

export function allProducts(state) {
  const base = BASE_PRODUCTS.map((p) => applyOverride(p, state.pstate[p.id]))
  const custom = state.custom.map((p) => applyOverride(p, state.pstate[p.id]))
  return [...base, ...custom]
}

function applyOverride(p, o) {
  return o ? { ...p, ...o } : p
}

export function getProduct(state, id) {
  return allProducts(state).find((p) => p.id === id) || null
}

export function productName(t, p) {
  return p.names ? p.names[t.lang] || p.names.pt : p.name
}

export const isSoldOut = (p) => p.available === false || p.stock <= 0

export function sizeOf(id) {
  return SIZES.find((s) => s.id === id) || SIZES[1]
}

/** Base units consumed by qty of a line: grams for kg products, otherwise the count. */
export function baseQty(p, size, qty) {
  return p.unit === 'kg' ? sizeOf(size).g * qty : qty
}

export function lineCents(p, size, qty) {
  return p.unit === 'kg' ? Math.round((p.price * sizeOf(size).g * qty) / 1000) : p.price * qty
}

export function unitSuffix(t, p) {
  return t(p.unit === 'kg' ? 'perKg' : p.unit === 'un' ? 'perUn' : 'perBunch')
}

export function formatStock(t, p, base) {
  if (p.unit === 'kg') return `${t.num(base / 1000)} ${t('unKg')}`
  return `${t.num(base)} ${t.plural(p.unit === 'un' ? 'un' : 'bunch', base)}`
}

export function formatWeight(t, grams) {
  return grams >= 1000 ? `${t.num(grams / 1000)} ${t('unKg')}` : `${grams} ${t.lang === 'ar' ? 'غ' : 'g'}`
}

/** Text shown for the size of an item: "M · 500 g" for kg products, the unit otherwise. */
export function sizeLabel(t, p, size) {
  if (p.unit !== 'kg') return t.plural(p.unit === 'un' ? 'un' : 'bunch', 1)
  const s = sizeOf(size)
  return `${t(s.k)} · ${formatWeight(t, s.g)}`
}

/** Remove accents and case so "mandioca", "Mandióca" and "MANDIOCA" match. */
export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function matchesQuery(p, q) {
  const n = norm(q)
  if (!n) return true
  const hay = p.names ? Object.values(p.names) : [p.name]
  return hay.some((h) => norm(h).includes(n))
}

// --- dates -----------------------------------------------------------------

/** Next `count` dates (at midnight) falling on the given weekdays (0 = Sunday). */
export function upcoming(days, count, from = new Date()) {
  const out = []
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = 0; i < 28 && out.length < count; i++) {
    if (days.includes(d.getDay())) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export const FAIR_DAYS = [6]
export const POINT_DAYS = [2, 4]
export const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const fromIso = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// --- orders ----------------------------------------------------------------

export const ACTIVE = ['new', 'preparing', 'ready']

export function orderTotals(state, items, mode) {
  const sub = items.reduce((n, it) => n + it.cents, 0)
  const fee = FEES[mode] ?? 0
  return { sub, fee, total: sub + fee }
}

export function makeItem(p, size, qty) {
  return { pid: p.id, name: p.names ? p.names : { pt: p.name, en: p.name, ar: p.name }, unit: p.unit, size, qty, cents: lineCents(p, size, qty), base: baseQty(p, size, qty), done: false }
}

export function seedOrders(now) {
  const min = 60 * 1000
  const P = Object.fromEntries(BASE_PRODUCTS.map((p) => [p.id, p]))
  const mk = (no, who, mode, status, ago, lines, extra = {}) => {
    const items = lines.map(([pid, size, qty]) => makeItem(P[pid], size, qty))
    const fee = FEES[mode]
    const at = now - ago * min
    return {
      id: `o${no}`, no, customer: { name: who, self: false }, items, mode, fee,
      total: items.reduce((n, i) => n + i.cents, 0) + fee,
      slot: isoDay(upcoming(mode === 'point' ? POINT_DAYS : FAIR_DAYS, 1)[0]),
      address: mode === 'home' ? { street: 'Rua das Palmeiras', number: '120', district: 'Centro', ref: '' } : null,
      status, createdAt: at, history: [{ status: 'new', at }], ...extra,
    }
  }
  const o = [
    mk(128, 'Maria S.', 'fair', 'new', 12, [['tomato', 'M', 2], ['lettuce', 'M', 2], ['cassava', 'L', 1]]),
    mk(127, 'João P.', 'home', 'new', 38, [['cassava', 'L', 3], ['herbs', 'M', 2], ['lettuce', 'M', 3], ['tomato', 'L', 2]]),
    mk(126, 'Ana L.', 'point', 'new', 55, [['herbs', 'M', 2], ['lettuce', 'M', 2]]),
    mk(125, 'Carlos M.', 'fair', 'preparing', 140, [['tomato', 'L', 2], ['herbs', 'M', 3]]),
    mk(124, 'Luiza R.', 'home', 'preparing', 200, [['cassava', 'L', 2], ['lettuce', 'M', 2]]),
    mk(123, 'Paulo T.', 'fair', 'ready', 600, [['tomato', 'M', 4]]),
    mk(122, 'Rita F.', 'point', 'done', 1500, [['herbs', 'M', 2], ['cassava', 'M', 2]]),
  ]
  // history for orders beyond "new"
  for (const x of o) {
    if (x.status !== 'new') x.history.push({ status: 'preparing', at: x.createdAt + 10 * min })
    if (x.status === 'ready' || x.status === 'done') x.history.push({ status: 'ready', at: x.createdAt + 120 * min })
    if (x.status === 'done') x.history.push({ status: 'done', at: x.createdAt + 300 * min })
    if (x.status === 'preparing') x.items.forEach((i, idx) => (i.done = idx === 0))
    if (x.status === 'ready' || x.status === 'done') x.items.forEach((i) => (i.done = true))
  }
  return o
}
