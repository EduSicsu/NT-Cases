import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
} from 'react'
import { useApp } from './store.jsx'
import { LANGS } from './i18n.js'
import { back as navBack, go } from './router.js'

// ---------------------------------------------------------------- icons ----

const PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search: '<path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.3-6.3"/>',
  basket: '<path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="m9 11 1 9"/><path d="m15 11-1 9"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.4-4.3A1 1 0 0 0 18 8h-4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  store: '<path d="m3 9 1-5h16l1 5"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A16 16 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M2 2l20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  wifiOff: '<path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M14 10.4a10 10 0 0 1 5 2.5M12 20h.01"/>',
}

const FLIP = new Set(['chevL', 'chevR'])

export function Icon({ name, size = 20, className = '', flip }) {
  const doFlip = flip ?? FLIP.has(name)
  return (
    <svg
      className={`icon ${doFlip ? 'flip' : ''} ${className}`} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }}
    />
  )
}

// --------------------------------------------------------------- photos ----

export function Photo({ p, className = '', eager = false, sizes = '(max-width: 430px) 45vw, 190px' }) {
  const [failed, setFailed] = useState(false)
  if (!p.img || failed) {
    return (
      <div className={`photo photo-fallback ${className}`} style={{ background: p.color || '#4F8A4B' }} aria-hidden="true">
        <Icon name="leaf" size={32} />
      </div>
    )
  }
  return (
    <div className={`photo ${className}`} style={{ background: p.color }} aria-hidden="true">
      <img
        src={`/img/${p.img}-480.webp`}
        srcSet={`/img/${p.img}-480.webp 480w, /img/${p.img}-960.webp 960w`}
        sizes={sizes} width="480" height="360" alt=""
        loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)}
      />
    </div>
  )
}

// -------------------------------------------------------------- buttons ----

export function Button({ kind = 'primary', size = 'lg', icon, loading, children, className = '', ...rest }) {
  return (
    <button
      type="button" className={`btn btn-${kind} btn-${size} ${className}`}
      aria-busy={loading || undefined} {...rest} disabled={rest.disabled || loading}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={20} /> : null}
      <span>{children}</span>
    </button>
  )
}

export function IconButton({ icon, label, onClick, className = '', size = 22, ...rest }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} onClick={onClick} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  )
}

export function Chip({ selected, onClick, children, icon, ...rest }) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick, 'aria-pressed': selected } : {})}
      className={`chip ${selected ? 'is-on' : ''} ${onClick ? 'is-btn' : ''}`} {...rest}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </Tag>
  )
}

export function Stepper({ value, min = 0, max = 99, onChange, label, labelDec, labelInc, name }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="step-btn" aria-label={`${labelDec}${name ? ' · ' + name : ''}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={18} />
      </button>
      <output className="step-val" aria-live="polite">{value}</output>
      <button type="button" className="step-btn is-plus" aria-label={`${labelInc}${name ? ' · ' + name : ''}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="switch-knob" />
    </button>
  )
}

// --------------------------------------------------------------- fields ----

export function Field({ label, error, hint, trailing, as = 'input', children, ...rest }) {
  const id = useId()
  const errId = `${id}-e`
  const hintId = `${id}-h`
  const Tag = as
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="control">
        <Tag
          id={id} aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined}
          {...rest}
        >
          {children}
        </Tag>
        {trailing}
      </div>
      {hint && !error && <p className="hint" id={hintId}>{hint}</p>}
      {error && <p className="err" id={errId} role="alert"><Icon name="alert" size={14} /> {error}</p>}
    </div>
  )
}

export function PasswordField({ label, error, hint, show, onToggle, t, ...rest }) {
  return (
    <Field
      label={label} error={error} hint={hint} type={show ? 'text' : 'password'} {...rest}
      trailing={
        <button type="button" className="field-toggle" onClick={onToggle} aria-label={show ? t('hidePass') : t('showPass')} aria-pressed={show}>
          <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
        </button>
      }
    />
  )
}

export function Tabs({ tabs, value, onChange, label }) {
  const refs = useRef([])
  const box = useRef(null)
  const [over, setOver] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const check = () => setOver(el.scrollWidth > el.clientWidth + 2 && Math.abs(el.scrollLeft) + el.clientWidth < el.scrollWidth - 2)
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', check); ro.disconnect() }
  }, [tabs.length, value])
  const onKey = (e, i) => {
    const dir = document.documentElement.dir === 'rtl' ? -1 : 1
    let n = null
    if (e.key === 'ArrowRight') n = i + dir
    else if (e.key === 'ArrowLeft') n = i - dir
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = tabs.length - 1
    if (n == null) return
    e.preventDefault()
    const next = (n + tabs.length) % tabs.length
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div className="tabs" role="tablist" aria-label={label} ref={box} data-over={over || undefined}>
      {tabs.map((tb, i) => (
        <button
          key={tb.id} ref={(el) => (refs.current[i] = el)} type="button" role="tab" id={`tab-${tb.id}`}
          aria-selected={value === tb.id} aria-controls="tabpanel" tabIndex={value === tb.id ? 0 : -1}
          className={`tab ${value === tb.id ? 'is-on' : ''}`} onClick={(e) => { onChange(tb.id); e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }} onKeyDown={(e) => onKey(e, i)}
        >
          {tb.label}
          {tb.count != null && <span className="tab-count">{tb.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- toasts ----

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(0)
  const dismiss = useCallback(() => { clearTimeout(timer.current); setToast(null) }, [])
  const show = useCallback((msg, opts = {}) => {
    clearTimeout(timer.current)
    const id = Date.now() + Math.random()
    setToast({ id, msg, ...opts })
    timer.current = setTimeout(() => setToast((c) => (c && c.id === id ? null : c)), opts.action ? 6000 : 3500)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-host" role="status" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="toast" key={toast.id}>
            <span>{toast.msg}</span>
            {toast.action && (
              <button type="button" className="toast-action" onClick={() => { toast.action.run(); dismiss() }}>{toast.action.label}</button>
            )}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  )
}

// ----------------------------------------------------------------- sheet ----

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onClose, title, children, footer }) {
  const ref = useRef(null)
  const titleId = useId()
  const { t } = useApp()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const node = ref.current
    const first = node.querySelector('[data-autofocus]') || node.querySelector(FOCUSABLE)
    first?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key !== 'Tab') return
      const f = [...node.querySelectorAll(FOCUSABLE)]
      if (!f.length) return
      const a = f[0]
      const z = f[f.length - 1]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-root">
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="dialog-head">
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="x" label={t('close')} onClick={onClose} />
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- layout ----

const scrollMemory = new Map()

export function Screen({ title, kicker, sub, backTo, topRight, band, nav, footer, children, tone, wide }) {
  const { t } = useApp()
  const scroller = useRef(null)
  const h1 = useRef(null)
  const key = window.location.hash
  useEffect(() => {
    const el = scroller.current
    const saved = scrollMemory.get(key)
    if (el && saved) el.scrollTop = saved
    ;(h1.current || el?.querySelector('h1'))?.focus({ preventScroll: true })
    return () => { if (el) scrollMemory.set(key, el.scrollTop) }
  }, [key])
  return (
    <div className={`screen ${tone || ''}`}>
      <main className="scroll" ref={scroller} id="main" tabIndex={-1}>
        <header className="band">
          <div className="band-row">
            {backTo ? <IconButton className="back-btn" icon="chevL" label={t('back')} onClick={() => navBack(backTo)} /> : <span />}
            {topRight}
          </div>
          {kicker && <p className="band-kicker">{kicker}</p>}
          {title && <h1 ref={h1} tabIndex={-1}>{title}</h1>}
          {sub && <p className="band-sub">{sub}</p>}
          {band}
        </header>
        <section className={`sheet ${wide ? 'sheet-wide' : ''}`}>{children}</section>
      </main>
      {footer && <footer className="footer">{footer}</footer>}
      {nav && <TabBar kind={nav.kind} active={nav.active} />}
    </div>
  )
}

export function TabBar({ kind, active }) {
  const { t, state } = useApp()
  const count = useMemo(() => state.cart.reduce((n, l) => n + l.qty, 0), [state.cart])
  const newOrders = state.orders.filter((o) => o.status === 'new' && !o.customer.self).length
  const mine = state.orders.filter((o) => o.customer.self && (o.status === 'new' || o.status === 'preparing' || o.status === 'ready')).length
  const items = kind === 'client'
    ? [
        { id: 'home', icon: 'home', label: t('navHome'), to: '/client/home' },
        { id: 'list', icon: 'list', label: t('navList'), to: '/client/list', badge: count, badgeLabel: t.plural('items', count) },
        { id: 'orders', icon: 'box', label: t('navOrders'), to: '/client/orders', badge: mine, dot: true },
        { id: 'profile', icon: 'user', label: t('navProfile'), to: '/profile' },
      ]
    : [
        { id: 'orders', icon: 'box', label: t('navOrders'), to: '/producer/orders', badge: newOrders, badgeLabel: t('tabNew') + ' ' + newOrders },
        { id: 'products', icon: 'leaf', label: t('navProducts'), to: '/producer/products' },
        { id: 'profile', icon: 'user', label: t('navProfile'), to: '/profile' },
      ]
  return (
    <nav className="tabbar" aria-label={t('navLabel')}>
      {items.map((it) => (
        <a
          key={it.id} href={`#${it.to}`} className={`tab-item ${active === it.id ? 'is-on' : ''}`}
          aria-current={active === it.id ? 'page' : undefined}
          onClick={(e) => { e.preventDefault(); if (active !== it.id) go(it.to, { replace: true }) }}
        >
          <span className="tab-icon">
            <Icon name={it.icon} size={24} />
            {it.badge > 0 && <span className="badge" aria-hidden="true">{it.badge > 9 ? '9+' : it.badge}</span>}
          </span>
          <span className="tab-label">{it.label}</span>
          {it.badge > 0 && <span className="sr-only">{it.badgeLabel || it.badge}</span>}
        </a>
      ))}
    </nav>
  )
}

export function EmptyState({ icon = 'basket', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-ic"><Icon name={icon} size={32} /></div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ h = 16, w = '100%', r = 10, className = '' }) {
  return <span className={`skeleton ${className}`} style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />
}

// ---------------------------------------------------- language & theme ----

export function LangPills({ compact }) {
  const { state, setLang, t } = useApp()
  return (
    <div className={`pills ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label={t('langLabel')}>
      {LANGS.map((l) => (
        <button
          key={l.id} type="button" role="radio" aria-checked={state.lang === l.id} lang={l.id}
          className={`pill ${state.lang === l.id ? 'is-on' : ''}`} onClick={() => setLang(l.id)} title={l.label}
        >
          {compact ? l.short : l.label}
        </button>
      ))}
    </div>
  )
}

export function ThemePills() {
  const { state, setTheme, t } = useApp()
  const opts = [['system', 'themeSystem', 'globe'], ['light', 'themeLight', 'sun'], ['dark', 'themeDark', 'moon']]
  return (
    <div className="pills" role="radiogroup" aria-label={t('themeLabel')}>
      {opts.map(([id, k, ic]) => (
        <button key={id} type="button" role="radio" aria-checked={state.theme === id} className={`pill ${state.theme === id ? 'is-on' : ''}`} onClick={() => setTheme(id)}>
          <Icon name={ic} size={16} /> {t(k)}
        </button>
      ))}
    </div>
  )
}

export function QuickSettings() {
  const { state, setTheme, t } = useApp()
  const dark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
  return (
    <div className="quick" role="group" aria-label={t('quickSettings')}>
      <LangPills compact />
      <IconButton
        className="quick-theme" icon={dark ? 'sun' : 'moon'} size={18}
        label={dark ? t('themeLight') : t('themeDark')} onClick={() => setTheme(dark ? 'light' : 'dark')}
      />
    </div>
  )
}
