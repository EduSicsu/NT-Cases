import { useEffect, useMemo, useRef, useState } from 'react'
import { cartLines, cartSubtotal, inCartBase, makeItem, maxQty, reconcileCart, useApp } from '../store.jsx'
import {
  ACTIVE, DEFAULT_SIZE, FAIR_DAYS, FEES, POINT_DAYS, SIZES, CATEGORIES, allProducts, baseQty, formatStock,
  formatWeight, getProduct, isoDay, isSoldOut, lineCents, matchesQuery, productName, sizeLabel, sizeOf, unitSuffix, upcoming,
} from '../data.js'
import { back, go } from '../router.js'
import {
  Button, Chip, EmptyState, Field, Icon, IconButton, Photo, Screen, Sheet, Skeleton, Stepper, Tabs, useToast,
} from '../ui.jsx'
import {
  MODE_ICON, MODE_KEY, OrderTimeline, StatusChip, Summary, itemName, itemSize, itemsLine, wherewhen,
} from './shared.jsx'

const CLIENT_HOME = '/client/home'
const CLIENT_NAV = (active) => ({ kind: 'client', active })

// ------------------------------------------------------------------ home ----

let homeSeen = false

function ProductCard({ p, t, inList, onAdd }) {
  const out = isSoldOut(p)
  const name = productName(t, p)
  return (
    <article className={`pcard ${out ? 'is-out' : ''}`}>
      <a className="pcard-link" href={`#/client/item/${p.id}`} onClick={(e) => { e.preventDefault(); go(`/client/item/${p.id}`) }}>
        <span className="pcard-photo">
          <Photo p={p} />
          {out && <span className="ribbon">{t('soldOut')}</span>}
        </span>
        <span className="pcard-name">{name}</span>
        <span className="pcard-price">
          <strong>{t.money(p.price)}</strong>
          <span>{unitSuffix(t, p)}</span>
        </span>
      </a>
      <button type="button" className="add-btn" disabled={out} aria-label={t('addQuick', { name })} onClick={onAdd}>
        <Icon name="plus" size={18} />
      </button>
      {inList > 0 && <span className="in-list"><Icon name="check" size={12} /> {t('inList')} · {inList}</span>}
    </article>
  )
}

export function ClientHome() {
  const { t, state, cartSet } = useApp()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [ready, setReady] = useState(homeSeen)

  useEffect(() => {
    if (ready) return
    const id = setTimeout(() => { homeSeen = true; setReady(true) }, 450)
    return () => clearTimeout(id)
  }, [ready])

  const products = useMemo(() => {
    const list = allProducts(state).filter((p) => (cat === 'all' || p.cat === cat) && matchesQuery(p, q))
    return [...list.filter((p) => !isSoldOut(p)), ...list.filter(isSoldOut)]
  }, [state, cat, q])

  const h = new Date().getHours()
  const greet = t(h < 12 ? 'greetMorning' : h < 18 ? 'greetAfternoon' : 'greetEvening', { name: state.user?.name || '' })

  const quickAdd = (p) => {
    const cur = state.cart.find((l) => l.pid === p.id && l.size === DEFAULT_SIZE)?.qty || 0
    if (cur + 1 > maxQty(state, p, DEFAULT_SIZE)) { toast(t('stockMax')); return }
    cartSet(p.id, DEFAULT_SIZE, cur + 1)
    toast(t('added', { name: productName(t, p) }), { action: { label: t('viewList'), run: () => go('/client/list') } })
  }
  const clear = () => { setQ(''); setCat('all') }

  return (
    <Screen
      kicker={greet} title={t('homeTitle')} nav={CLIENT_NAV('home')}
      topRight={<IconButton className="avatar" icon="user" label={t('navProfile')} onClick={() => go('/profile')} />}
      band={
        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <Icon name="search" size={20} />
          <input type="search" aria-label={t('searchLabel')} placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" autoComplete="off" />
          {q && <IconButton icon="x" size={18} label={t('clearSearch')} onClick={() => setQ('')} />}
        </form>
      }
    >
      <div className="chips" role="group" aria-label={t('catAll')}>
        {CATEGORIES.map((c) => <Chip key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>{t(c.k)}</Chip>)}
      </div>
      <div className="meta-row">
        <span className="badge-organic"><Icon name="leaf" size={16} /> {t('organic')}</span>
        <span className="sr-only" role="status" aria-live="polite">{ready ? t.plural('results', products.length) : t('loading')}</span>
      </div>
      {!ready ? (
        <div className="grid" aria-busy="true" aria-label={t('loading')}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="pcard"><Skeleton h={110} r={14} /><Skeleton h={16} w="70%" className="mt" /><Skeleton h={16} w="45%" className="mt" /></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon="search" title={t('noResults')} text={t('noResultsText')} action={<Button kind="secondary" size="sm" onClick={clear}>{t('clearFilters')}</Button>} />
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} t={t} inList={state.cart.filter((l) => l.pid === p.id).reduce((n, l) => n + l.qty, 0)} onAdd={() => quickAdd(p)} />
          ))}
        </div>
      )}
    </Screen>
  )
}

// ------------------------------------------------------------------ item ----

export function ClientItem({ params }) {
  const { t, state, cartSet } = useApp()
  const toast = useToast()
  const p = getProduct(state, params.id)
  const existing = p ? state.cart.filter((l) => l.pid === p.id) : []
  const [size, setSize] = useState(existing[0]?.size || DEFAULT_SIZE)
  const line = existing.find((l) => l.size === size)
  const [qty, setQty] = useState(line?.qty || 1)

  // switching size loads that size's quantity (or 1)
  const pickSize = (s) => { setSize(s); setQty(state.cart.find((l) => l.pid === p.id && l.size === s)?.qty || 1) }

  if (!p) {
    return (
      <Screen title={t('notFoundTitle')} backTo={CLIENT_HOME} nav={CLIENT_NAV('home')}>
        <EmptyState icon="alert" title={t('notFoundItem')} action={<Button onClick={() => go(CLIENT_HOME, { replace: true })}>{t('goHome')}</Button>} />
      </Screen>
    )
  }
  const out = isSoldOut(p)
  const max = maxQty(state, p, p.unit === 'kg' ? size : DEFAULT_SIZE)
  const lineSize = p.unit === 'kg' ? size : DEFAULT_SIZE
  const q = Math.min(qty, Math.max(max, 1))
  const total = lineCents(p, lineSize, q)
  const low = !out && p.stock <= (p.unit === 'kg' ? 3000 : 10)
  const name = productName(t, p)
  const save = () => {
    cartSet(p.id, lineSize, q)
    toast(t('added', { name }), { action: { label: t('viewList'), run: () => go('/client/list') } })
    back(CLIENT_HOME)
  }
  const changed = !line || line.qty !== q

  return (
    <Screen
      title={name} backTo={CLIENT_HOME}
      band={<Photo p={p} className="photo-hero" eager sizes="(max-width: 430px) 80vw, 340px" />}
      footer={
        <Button disabled={out || max < 1 || (!!line && !changed)} onClick={save}>
          {out ? t('soldOut') : t(line ? 'updateList' : 'addToList', { total: t.money(total) })}
        </Button>
      }
    >
      <p className="muted-text">{t('itemFarm', { farm: t('farmName'), km: 12 })}</p>
      <div className="tags"><Chip icon="leaf" selected>{t('tagOrganic')}</Chip><Chip>{t('tagToday')}</Chip></div>
      <p className="price-big"><strong>{t.money(p.price)}</strong><span>{unitSuffix(t, p)}</span></p>
      {low && <p className="warn-text" role="status"><Icon name="alert" size={16} /> {t('stockLeft', { stock: formatStock(t, p, p.stock) })}</p>}
      {p.unit === 'kg' && (
        <fieldset className="group">
          <legend>{t('sizeLabel')}</legend>
          <div className="chips">
            {SIZES.map((s) => <Chip key={s.id} selected={size === s.id} onClick={() => pickSize(s.id)}>{sizeLabel(t, p, s.id)}</Chip>)}
          </div>
        </fieldset>
      )}
      <div className="row-between">
        <span className="label-strong" id="qty-l">{t('qtyLabel')}</span>
        <Stepper value={q} min={1} max={Math.max(max, 1)} onChange={setQty} label={t('qtyLabel')} labelDec={t('dec')} labelInc={t('inc')} name={name} />
      </div>
      <p className="hint-line" role="status" aria-live="polite">
        {p.unit === 'kg' && t('lineWeight', { qty: q, size: sizeLabel(t, p, size), weight: formatWeight(t, baseQty(p, size, q)) })}
        {q >= max && max >= 1 && <span className="warn-text"> {t('stockMax')}</span>}
      </p>
      <div className="callout"><Icon name="leaf" size={20} /><p>{t('itemNote')}</p></div>
    </Screen>
  )
}

// ------------------------------------------------------------------ list ----

export function ClientList() {
  const { t, state, cartSet, cartAll } = useApp()
  const toast = useToast()
  const lines = cartLines(state)
  const subtotal = cartSubtotal(state)
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const cartRef = useRef(state.cart)
  cartRef.current = state.cart

  // Stock can change while the list sits there (another customer, the producer). Fix it quietly.
  useEffect(() => {
    const r = reconcileCart(state)
    if (r.changed.length) {
      cartAll(r.cart)
      const names = r.changed.map((id) => { const p = getProduct(state, id); return p ? productName(t, p) : id }).join(', ')
      toast(t('stockChanged', { name: names }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remove = (l) => {
    cartSet(l.pid, l.size, 0)
    toast(t('removed', { name: productName(t, l.p) }), { action: { label: t('undo'), run: () => cartSet(l.pid, l.size, l.qty) } })
  }
  const clearAll = () => {
    const prev = cartRef.current
    cartAll([])
    toast(t('clearList'), { action: { label: t('undo'), run: () => cartAll(prev) } })
  }

  return (
    <Screen
      title={t('listTitle')} sub={lines.length ? `${t('listSub', { farm: t('farmName') })} · ${t.plural('items', count)}` : undefined}
      nav={CLIENT_NAV('list')}
      footer={lines.length ? <Button onClick={() => go('/client/delivery')}>{t('chooseDelivery')}<Icon name="chevR" size={20} /></Button> : null}
    >
      {lines.length === 0 ? (
        <EmptyState icon="basket" title={t('emptyListTitle')} text={t('emptyListText')} action={<Button onClick={() => go(CLIENT_HOME)}>{t('emptyCta')}</Button>} />
      ) : (
        <>
          <ul className="lines">
            {lines.map((l) => {
              const name = productName(t, l.p)
              const max = maxQty(state, l.p, l.size)
              return (
                <li key={l.pid + l.size} className="line">
                  <a className="line-photo" href={`#/client/item/${l.pid}`} onClick={(e) => { e.preventDefault(); go(`/client/item/${l.pid}`) }} aria-label={name}><Photo p={l.p} sizes="72px" /></a>
                  <div className="line-body">
                    <strong>{name}</strong>
                    <span className="muted-text">{sizeLabel(t, l.p, l.size)}</span>
                  </div>
                  <strong className="line-price">{t.money(l.cents)}</strong>
                  <div className="line-actions">
                    <Stepper value={l.qty} min={1} max={Math.max(max, 1)} onChange={(v) => cartSet(l.pid, l.size, v)} label={name} labelDec={t('dec')} labelInc={t('inc')} name={name} />
                    <IconButton icon="trash" size={18} label={t('removeItem', { name })} onClick={() => remove(l)} />
                  </div>
                </li>
              )
            })}
          </ul>
          <Summary t={t} rows={[]} total={[t('subtotal'), t.money(subtotal)]} />
          <p className="note">{t('listHint')}</p>
          <Button kind="ghost" size="sm" icon="trash" onClick={clearAll}>{t('clearList')}</Button>
        </>
      )}
    </Screen>
  )
}

// -------------------------------------------------------------- delivery ----

export function ClientDelivery() {
  const { t, state, place } = useApp()
  const toast = useToast()
  const lines = cartLines(state)
  const subtotal = cartSubtotal(state)
  const [mode, setMode] = useState('fair')
  const [slotIdx, setSlotIdx] = useState({ fair: 0, point: 0 })
  const [addr, setAddr] = useState({ street: '', number: '', district: '', ref: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const alive = useRef(true)
  const sentRef = useRef(false)
  useEffect(() => () => { alive.current = false }, [])

  useEffect(() => { if (lines.length === 0 && !sentRef.current) go('/client/list', { replace: true }) }, [lines.length])

  const slots = useMemo(() => ({ fair: upcoming(FAIR_DAYS, 3), point: upcoming(POINT_DAYS, 4) }), [])
  const fee = FEES[mode]
  const modes = [
    { id: 'fair', title: t('optFair'), desc: `${t('fairPlace')} · ${t('fairHours')}` },
    { id: 'point', title: t('optPoint'), desc: `${t('pointPlace')} · ${t('pointHours')}` },
    { id: 'home', title: t('optHome'), desc: t('homeDesc') },
  ]
  const onKey = (e, i) => {
    const rtl = t.dir === 'rtl' ? -1 : 1
    const step = e.key === 'ArrowDown' || e.key === (rtl > 0 ? 'ArrowRight' : 'ArrowLeft') ? 1 : e.key === 'ArrowUp' || e.key === (rtl > 0 ? 'ArrowLeft' : 'ArrowRight') ? -1 : 0
    if (!step) return
    e.preventDefault()
    const n = modes[(i + step + modes.length) % modes.length]
    setMode(n.id)
    document.getElementById(`mode-${n.id}`)?.focus()
  }
  const setA = (k) => (e) => { setAddr({ ...addr, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }) }

  const send = () => {
    if (sending) return
    const er = {}
    if (mode === 'home') {
      for (const k of ['street', 'number', 'district']) if (!addr[k].trim()) er[k] = t('required')
    }
    setErrors(er)
    if (Object.keys(er).length) { requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus()); return }
    // re-check stock right before sending
    const r = reconcileCart(state)
    if (r.changed.length) { toast(t('stockChanged', { name: r.changed.map((id) => productName(t, getProduct(state, id) || { name: id })).join(', ') })); go('/client/list', { replace: true }); return }
    setSending(true)
    setTimeout(() => {
      if (!alive.current) return
      const items = lines.map((l) => makeItem(l.p, l.size, l.qty))
      const slotDate = mode === 'home' ? null : slots[mode][slotIdx[mode]]
      const order = {
        id: `o${state.nextNo}`, no: state.nextNo, customer: { name: state.user?.name || t('customer'), self: true }, items, mode, fee,
        total: subtotal + fee, slot: slotDate ? isoDay(slotDate) : null,
        address: mode === 'home' ? { ...addr, street: addr.street.trim(), number: addr.number.trim(), district: addr.district.trim() } : null,
        status: 'new', createdAt: Date.now(), history: [{ status: 'new', at: Date.now() }],
      }
      sentRef.current = true
      place(order)
      go(`/client/sent/${order.id}`, { replace: true })
    }, 800)
  }

  return (
    <Screen
      title={t('delTitle')} backTo="/client/list"
      footer={
        <>
          <p className="footer-note">{t('delFooter')}</p>
          <Button loading={sending} disabled={lines.length === 0} onClick={send}>{sending ? t('sending') : t('sendOrder')}</Button>
        </>
      }
    >
      <div className="cards" role="radiogroup" aria-label={t('deliveryGroup')}>
        {modes.map((m, i) => (
          <div key={m.id} className={`opt-wrap ${mode === m.id ? 'is-on' : ''}`}>
            <button
              id={`mode-${m.id}`} type="button" role="radio" aria-checked={mode === m.id} tabIndex={mode === m.id ? 0 : -1}
              className={`opt ${mode === m.id ? 'is-on' : ''}`} onClick={() => setMode(m.id)} onKeyDown={(e) => onKey(e, i)}
            >
              <span className="opt-ic"><Icon name={MODE_ICON[m.id]} size={24} /></span>
              <span className="opt-text">
                <strong>{m.title}</strong>
                <span>{m.desc}</span>
                <b className={FEES[m.id] === 0 ? 'ok-text' : ''}>{FEES[m.id] === 0 ? t('free') : t('fee', { price: t.money(FEES[m.id]) })}</b>
              </span>
              <span className="radio" aria-hidden="true">{mode === m.id && <Icon name="check" size={14} />}</span>
            </button>
            {mode === m.id && m.id !== 'home' && (
              <div className="opt-extra">
                <Field
                  as="select" label={t('slotLabel')} value={slotIdx[m.id]}
                  onChange={(e) => setSlotIdx({ ...slotIdx, [m.id]: Number(e.target.value) })}
                >
                  {slots[m.id].map((d, k) => <option key={k} value={k}>{t.day(d)} · {m.id === 'fair' ? t('fairHours') : t('pointHours')}</option>)}
                </Field>
              </div>
            )}
            {mode === m.id && m.id === 'home' && (
              <div className="opt-extra">
                <p className="label-strong">{t('addrTitle')}</p>
                <Field label={t('fStreet')} value={addr.street} error={errors.street} autoComplete="address-line1" onChange={setA('street')} />
                <div className="two">
                  <Field label={t('fNumber')} value={addr.number} error={errors.number} inputMode="numeric" autoComplete="off" onChange={setA('number')} />
                  <Field label={t('fDistrict')} value={addr.district} error={errors.district} autoComplete="address-level3" onChange={setA('district')} />
                </div>
                <Field label={t('fRef')} value={addr.ref} autoComplete="address-line2" onChange={setA('ref')} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Summary
        t={t}
        rows={[[t('sumItems', { n: lines.reduce((n, l) => n + l.qty, 0) }), t.money(subtotal)], [t('sumDelivery'), fee ? t.money(fee) : t('free')]]}
        total={[t('total'), t.money(subtotal + fee)]}
      />
    </Screen>
  )
}

// ------------------------------------------------------------- order sent ----

export function ClientSent({ params }) {
  const { t, state } = useApp()
  const o = state.orders.find((x) => x.id === params.id && x.customer.self)
  if (!o) return <OrderMissing backTo={CLIENT_HOME} />
  return (
    <Screen
      nav={CLIENT_NAV('orders')} band={<div className="big-check" aria-hidden="true"><Icon name="check" size={52} /></div>}
      footer={<><Button onClick={() => go(`/client/orders/${o.id}`, { replace: true })}>{t('trackOrder')}</Button><Button kind="ghost" onClick={() => go(CLIENT_HOME, { replace: true })}>{t('backHome')}</Button></>}
    >
      <div className="center-text">
        <h1 className="h1" tabIndex={-1}>{t('sentTitle')}</h1>
        <p className="lede">{t('sentSub', { farm: t('farmName') })}</p>
        <p className="order-no">{t('orderNo', { no: o.no })}</p>
      </div>
      <OrderTimeline t={t} order={o} />
      <div className="callout"><Icon name={MODE_ICON[o.mode]} size={20} /><p>{wherewhen(t, o)}</p></div>
    </Screen>
  )
}

function OrderMissing({ backTo }) {
  const { t } = useApp()
  return (
    <Screen title={t('orderDetail')} backTo={backTo} nav={CLIENT_NAV('orders')}>
      <EmptyState icon="alert" title={t('orderMissing')} action={<Button onClick={() => go('/client/orders', { replace: true })}>{t('ordersTitle')}</Button>} />
    </Screen>
  )
}

// ---------------------------------------------------------------- orders ----

export function ClientOrders() {
  const { t, state } = useApp()
  const [tab, setTab] = useState('active')
  const mine = state.orders.filter((o) => o.customer.self).sort((a, b) => b.createdAt - a.createdAt)
  const active = mine.filter((o) => ACTIVE.includes(o.status))
  const past = mine.filter((o) => !ACTIVE.includes(o.status))
  const list = tab === 'active' ? active : past
  return (
    <Screen
      title={t('ordersTitle')} nav={CLIENT_NAV('orders')}
      band={<Tabs label={t('ordersTitle')} value={tab} onChange={setTab} tabs={[{ id: 'active', label: t('tabActive'), count: active.length }, { id: 'past', label: t('tabPast'), count: past.length }]} />}
    >
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="stack">
        {list.length === 0 ? (
          <EmptyState
            icon="box" title={t(tab === 'active' ? 'noOrders' : 'noPast')} text={t(tab === 'active' ? 'noOrdersText' : 'noPastText')}
            action={tab === 'active' ? <Button onClick={() => go(CLIENT_HOME)}>{t('emptyCta')}</Button> : null}
          />
        ) : list.map((o) => (
          <a key={o.id} className="ocard" href={`#/client/orders/${o.id}`} onClick={(e) => { e.preventDefault(); go(`/client/orders/${o.id}`) }}>
            <span className="ocard-top"><strong>{t('orderNo', { no: o.no })}</strong><strong>{t.money(o.total)}</strong></span>
            <span className="muted-text">{itemsLine(t, o)}</span>
            <span className="ocard-bottom"><StatusChip t={t} order={o} /><span className="muted-text">{t.ago(o.createdAt)}</span></span>
          </a>
        ))}
      </div>
    </Screen>
  )
}

export function ClientOrder({ params }) {
  const { t, state, orderStatus, cartMany } = useApp()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const o = state.orders.find((x) => x.id === params.id && x.customer.self)
  if (!o) return <OrderMissing backTo="/client/orders" />

  const cancel = () => { orderStatus(o.id, 'cancelled'); setConfirm(false); toast(t('toastCancelled')) }
  const again = () => {
    const lines = []
    let missing = false
    for (const it of o.items) {
      const p = getProduct(state, it.pid)
      if (!p || isSoldOut(p)) { missing = true; continue }
      const size = p.unit === 'kg' ? it.size : DEFAULT_SIZE
      const room = Math.floor((p.stock - inCartBase(state, p.id, size)) / baseQty(p, size, 1))
      const qty = Math.min(it.qty, room)
      if (qty < it.qty) missing = true
      if (qty > 0) lines.push({ pid: p.id, size, qty })
    }
    if (lines.length) cartMany(lines)
    toast(t(missing ? 'againMissing' : 'againToast'))
    if (lines.length) go('/client/list')
  }
  return (
    <Screen
      title={t('orderNo', { no: o.no })} sub={t('placedAt', { when: t.ago(o.createdAt) })} backTo="/client/orders" nav={CLIENT_NAV('orders')}
      footer={
        o.status === 'new' ? <Button kind="outline" onClick={() => setConfirm(true)}>{t('cancelOrder')}</Button>
          : !ACTIVE.includes(o.status) ? <Button onClick={again}>{t('orderAgain')}</Button> : null
      }
    >
      <OrderTimeline t={t} order={o} />
      {o.status === 'preparing' && <p className="note">{t('cancelOnlyNew')}</p>}
      <h2 className="h2">{t('where')}</h2>
      <div className="callout"><Icon name={MODE_ICON[o.mode]} size={20} /><p><strong>{t(MODE_KEY[o.mode])}</strong><br />{wherewhen(t, o)}</p></div>
      <ul className="lines compact">
        {o.items.map((it, i) => (
          <li key={i} className="row-between"><span><strong>{itemName(t, it)}</strong><br /><span className="muted-text">{itemSize(t, it)} × {it.qty}</span></span><strong>{t.money(it.cents)}</strong></li>
        ))}
      </ul>
      <Summary t={t} rows={[[t('sumItems', { n: o.items.reduce((n, i) => n + i.qty, 0) }), t.money(o.total - o.fee)], [t('sumDelivery'), o.fee ? t.money(o.fee) : t('free')]]} total={[t('total'), t.money(o.total)]} />
      <Sheet
        open={confirm} onClose={() => setConfirm(false)} title={t('cancelTitle')}
        footer={<><Button kind="outline" onClick={() => setConfirm(false)}>{t('keepOrder')}</Button><Button kind="danger" onClick={cancel}>{t('cancelOrder')}</Button></>}
      >
        <p className="body-text">{t('cancelText')}</p>
      </Sheet>
    </Screen>
  )
}
