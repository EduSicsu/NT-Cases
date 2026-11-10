import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { makeT } from './i18n.js'
import {
  allProducts, baseQty, getProduct, lineCents, makeItem, orderTotals, seedOrders, sizeOf,
} from './data.js'

const KEY = 'hilda:v1'

function detectLang() {
  const l = (typeof navigator !== 'undefined' && navigator.language || 'pt').toLowerCase()
  return l.startsWith('ar') ? 'ar' : l.startsWith('en') ? 'en' : 'pt'
}

export function initialState(now = Date.now()) {
  return {
    v: 1, lang: detectLang(), theme: 'system', user: null,
    lastRole: null, cart: [], pstate: {}, custom: [], orders: seedOrders(now), nextNo: 129,
  }
}

const tabRole = () => { try { return sessionStorage.getItem('hilda:role') } catch { return null } }
const saveTabRole = (r) => { try { if (r) sessionStorage.setItem('hilda:role', r) } catch { /* ignore */ } }

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw)
    if (s && s.v === 1 && Array.isArray(s.orders)) {
      const r = tabRole()
      if (s.user && r) s.user.role = r
      return s
    }
  } catch { /* private mode or corrupted data: start fresh */ }
  return initialState()
}

function adjustStock(state, pid, delta) {
  const p = getProduct(state, pid)
  if (!p) return state
  const next = Math.max(0, p.stock + delta)
  return { ...state, pstate: { ...state.pstate, [pid]: { ...state.pstate[pid], stock: next } } }
}

function reducer(state, a) {
  switch (a.type) {
    case 'HYDRATE': {
      // account data comes from the other tab, but each tab keeps its own role
      const role = state.user?.role
      return { ...a.state, user: a.state.user ? { ...a.state.user, role: role ?? a.state.user.role } : null }
    }
    case 'SET': return { ...state, ...a.patch }
    case 'LOGIN': return { ...state, user: a.user }
    case 'LOGOUT': return { ...state, user: null }
    case 'SET_ROLE': return { ...state, lastRole: a.role, user: state.user ? { ...state.user, role: a.role } : state.user }
    case 'CART_SET': {
      const { pid, size, qty } = a
      const rest = state.cart.filter((l) => !(l.pid === pid && l.size === size))
      return { ...state, cart: qty > 0 ? [...rest, { pid, size, qty }].sort(byPid(state)) : rest }
    }
    case 'CART_ALL': return { ...state, cart: a.cart }
    case 'CART_CLEAR': return { ...state, cart: [] }
    case 'CART_MANY': {
      let cart = [...state.cart]
      for (const n of a.lines) {
        const i = cart.findIndex((l) => l.pid === n.pid && l.size === n.size)
        if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + n.qty }
        else cart.push(n)
      }
      return { ...state, cart }
    }
    case 'PLACE': {
      let s = { ...state, orders: [a.order, ...state.orders], nextNo: state.nextNo + 1, cart: [] }
      for (const it of a.order.items) s = adjustStock(s, it.pid, -it.base)
      return s
    }
    case 'ORDER_STATUS': {
      const o = state.orders.find((x) => x.id === a.id)
      if (!o) return state
      const at = Date.now()
      const upd = { ...o, status: a.status, history: [...o.history, { status: a.status, at }], ...(a.reason ? { reason: a.reason } : {}) }
      let s = { ...state, orders: state.orders.map((x) => (x.id === a.id ? upd : x)) }
      if (a.status === 'declined' || a.status === 'cancelled') for (const it of o.items) s = adjustStock(s, it.pid, it.base)
      return s
    }
    case 'ORDER_ITEM': {
      return { ...state, orders: state.orders.map((o) => o.id !== a.id ? o : { ...o, items: o.items.map((it, i) => (i === a.idx ? { ...it, done: a.done } : it)) }) }
    }
    case 'PRODUCT_UPDATE': return { ...state, pstate: { ...state.pstate, [a.id]: { ...state.pstate[a.id], ...a.patch } } }
    case 'PRODUCT_ADD': return { ...state, custom: [...state.custom, a.product] }
    case 'RESET': return { ...initialState(), lang: state.lang, theme: state.theme, user: state.user, lastRole: state.lastRole }
    default: return state
  }
}

const byPid = (state) => (a, b) => {
  const ids = allProducts(state).map((p) => p.id)
  return ids.indexOf(a.pid) - ids.indexOf(b.pid) || sizeOf(a.size).g - sizeOf(b.size).g
}

// --- cart selectors ---------------------------------------------------------

export function cartLines(state) {
  return state.cart
    .map((l) => {
      const p = getProduct(state, l.pid)
      return p ? { ...l, p, cents: lineCents(p, l.size, l.qty), base: baseQty(p, l.size, l.qty) } : null
    })
    .filter(Boolean)
}

export const cartCount = (state) => cartLines(state).reduce((n, l) => n + l.qty, 0)
export const cartSubtotal = (state) => cartLines(state).reduce((n, l) => n + l.cents, 0)

/** Base units of a product already in the cart, optionally ignoring one size line. */
export function inCartBase(state, pid, exceptSize) {
  return cartLines(state).filter((l) => l.pid === pid && l.size !== exceptSize).reduce((n, l) => n + l.base, 0)
}

/** Largest quantity of `size` that fits in stock next to the other lines of this product. */
export function maxQty(state, p, size) {
  const room = p.stock - inCartBase(state, p.id, size)
  const per = baseQty(p, size, 1)
  return Math.max(0, Math.floor(room / per))
}

/** Clamp cart quantities to current stock. Returns the new cart and the product ids that changed. */
export function reconcileCart(state) {
  const left = {}
  const changed = []
  const cart = []
  for (const l of state.cart) {
    const p = getProduct(state, l.pid)
    if (!p || p.available === false) { changed.push(l.pid); continue }
    left[l.pid] ??= p.stock
    const per = baseQty(p, l.size, 1)
    const qty = Math.min(l.qty, Math.floor(left[l.pid] / per))
    if (qty !== l.qty) changed.push(l.pid)
    if (qty > 0) { cart.push({ ...l, qty }); left[l.pid] -= qty * per }
  }
  return { cart, changed: [...new Set(changed)] }
}

// --- context ----------------------------------------------------------------

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const lastSaved = useRef(null)
  const t = useMemo(() => makeT(state.lang), [state.lang])

  useEffect(() => {
    try {
      const s = JSON.stringify(state)
      if (s !== lastSaved.current) { localStorage.setItem(KEY, s); lastSaved.current = s }
    } catch { /* storage full or blocked: the app keeps working in memory */ }
  }, [state])

  // Keep two open tabs in sync (for example producer in one, customer in the other).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY || !e.newValue || e.newValue === lastSaved.current) return
      try {
        const s = JSON.parse(e.newValue)
        if (s && s.v === 1) { lastSaved.current = e.newValue; dispatch({ type: 'HYDRATE', state: s }) }
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const actions = useMemo(() => ({
    setLang: (lang) => dispatch({ type: 'SET', patch: { lang } }),
    setTheme: (theme) => dispatch({ type: 'SET', patch: { theme } }),
    login: (user) => { saveTabRole(user.role); dispatch({ type: 'LOGIN', user }) },
    logout: () => dispatch({ type: 'LOGOUT' }),
    setRole: (role) => { saveTabRole(role); dispatch({ type: 'SET_ROLE', role }) },
    cartSet: (pid, size, qty) => dispatch({ type: 'CART_SET', pid, size, qty }),
    cartAll: (cart) => dispatch({ type: 'CART_ALL', cart }),
    cartClear: () => dispatch({ type: 'CART_CLEAR' }),
    cartMany: (lines) => dispatch({ type: 'CART_MANY', lines }),
    place: (order) => dispatch({ type: 'PLACE', order }),
    orderStatus: (id, status, reason) => dispatch({ type: 'ORDER_STATUS', id, status, reason }),
    orderItem: (id, idx, done) => dispatch({ type: 'ORDER_ITEM', id, idx, done }),
    productUpdate: (id, patch) => dispatch({ type: 'PRODUCT_UPDATE', id, patch }),
    productAdd: (product) => dispatch({ type: 'PRODUCT_ADD', product }),
    reset: () => dispatch({ type: 'RESET' }),
  }), [])

  const value = useMemo(() => ({ state, t, ...actions }), [state, t, actions])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export { makeItem, orderTotals }
