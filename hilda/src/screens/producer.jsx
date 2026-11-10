import { useMemo, useState } from 'react'
import { useApp } from '../store.jsx'
import { ACTIVE, FAIR_DAYS, allProducts, formatStock, isSoldOut, productName, unitSuffix, upcoming } from '../data.js'
import { go } from '../router.js'
import { Button, Chip, EmptyState, Field, Icon, Photo, Screen, Sheet, Switch, Tabs, useToast } from '../ui.jsx'
import { MODE_ICON, MODE_KEY, OrderTimeline, StatusChip, itemName, itemSize, itemsLine, wherewhen } from './shared.jsx'

const NAV = (active) => ({ kind: 'producer', active })
const PRODUCER_HOME = '/producer/orders'

const TAB_STATUS = { new: ['new'], preparing: ['preparing'], ready: ['ready'], done: ['done', 'declined', 'cancelled'] }

// ---------------------------------------------------------------- orders ----

export function ProducerOrders() {
  const { t, state } = useApp()
  const [tab, setTab] = useState('new')
  const by = (id) => state.orders.filter((o) => TAB_STATUS[id].includes(o.status))
  const counts = { new: by('new').length, preparing: by('preparing').length, ready: by('ready').length }
  const list = by(tab).sort((a, b) => (tab === 'done' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
  const nextFair = upcoming(FAIR_DAYS, 1)[0]
  const tabs = [
    { id: 'new', label: t('tabNew'), count: counts.new },
    { id: 'preparing', label: t('tabPrep'), count: counts.preparing },
    { id: 'ready', label: t('tabReady'), count: counts.ready },
    { id: 'done', label: t('tabDone') },
  ]
  return (
    <Screen
      title={t('pOrdersTitle')} sub={t('pOrdersSub', { place: t('fairPlace'), date: t.day(nextFair) })} nav={NAV('orders')}
      band={<Tabs label={t('pOrdersTitle')} value={tab} onChange={setTab} tabs={tabs} />}
    >
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0} className="stack">
        {list.length === 0 ? (
          <EmptyState icon="box" title={t({ new: 'emptyNew', preparing: 'emptyPrep', ready: 'emptyReady', done: 'emptyDone' }[tab])} text={t('emptyOrdersText')} />
        ) : list.map((o) => (
          <a key={o.id} className="ocard" href={`#/producer/orders/${o.id}`} onClick={(e) => { e.preventDefault(); go(`/producer/orders/${o.id}`) }}>
            <span className="ocard-top"><strong>{t('orderNo', { no: o.no })}</strong><strong>{t.money(o.total)}</strong></span>
            <span className="muted-text">{o.customer.name} · {t.plural('items', o.items.length)}</span>
            <span className="muted-text">{itemsLine(t, o)}</span>
            <span className="ocard-bottom">
              <Chip icon={MODE_ICON[o.mode]}>{t(MODE_KEY[o.mode])}</Chip>
              {tab === 'done' ? <StatusChip t={t} order={o} producer /> : <span className="muted-text">{t.ago(o.createdAt)}</span>}
            </span>
          </a>
        ))}
      </div>
    </Screen>
  )
}

export function ProducerOrder({ params }) {
  const { t, state, orderStatus, orderItem } = useApp()
  const toast = useToast()
  const [decline, setDecline] = useState(false)
  const [reason, setReason] = useState('')
  const o = state.orders.find((x) => x.id === params.id)
  if (!o) {
    return (
      <Screen title={t('orderDetail')} backTo={PRODUCER_HOME} nav={NAV('orders')}>
        <EmptyState icon="alert" title={t('orderMissing')} action={<Button onClick={() => go(PRODUCER_HOME, { replace: true })}>{t('pOrdersTitle')}</Button>} />
      </Screen>
    )
  }
  const done = o.items.filter((i) => i.done).length
  const all = done === o.items.length
  const picking = o.status === 'preparing'

  // total to harvest, grouped by product
  const totals = totalsText(o, t)

  const act = (status, msg, extra) => { orderStatus(o.id, status, extra); toast(t(msg)) }
  const confirmDecline = () => { orderStatus(o.id, 'declined', reason); setDecline(false); toast(t('toastDeclined')); go(PRODUCER_HOME, { replace: true }) }

  let footer = null
  if (o.status === 'new') {
    footer = <div className="row-actions"><Button kind="outline" onClick={() => { setReason(''); setDecline(true) }}>{t('decline')}</Button><Button onClick={() => act('preparing', 'toastAccepted')}>{t('accept')}</Button></div>
  } else if (o.status === 'preparing') {
    footer = <><Button disabled={!all} onClick={() => act('ready', 'toastReady')}>{t('markReady')}</Button>{!all && <p className="footer-note">{t('markReadyHint')}</p>}</>
  } else if (o.status === 'ready') {
    footer = <Button onClick={() => act('done', 'toastDone')}>{t(o.mode === 'home' ? 'confirmHome' : 'confirmPickup')}</Button>
  }

  return (
    <Screen
      title={t('orderNo', { no: o.no })} sub={`${o.customer.name} · ${t.ago(o.createdAt)}`} backTo={PRODUCER_HOME} nav={NAV('orders')} footer={footer}
      topRight={<StatusChip t={t} order={o} producer />}
    >
      <div className="callout"><Icon name={MODE_ICON[o.mode]} size={20} /><p><strong>{t(MODE_KEY[o.mode])}</strong><br />{wherewhen(t, o)}</p></div>
      <div className="row-between">
        <h2 className="h2">{t('whatSet')}</h2>
        {picking && <span className="muted-text" role="status" aria-live="polite">{t('pickProgress', { done, total: o.items.length })}</span>}
      </div>
      <ul className="pick">
        {o.items.map((it, i) => (
          <li key={i} className={`pick-row ${it.done ? 'is-done' : ''}`}>
            {picking ? (
              <label className="pick-label">
                <input type="checkbox" checked={!!it.done} onChange={(e) => orderItem(o.id, i, e.target.checked)} aria-label={t('pickItem', { name: itemName(t, it) })} />
                <span className="box" aria-hidden="true"><Icon name="check" size={16} /></span>
                <span className="pick-text"><strong>{itemName(t, it)}</strong><span>{itemSize(t, it)}</span></span>
                <strong className="qty">× {it.qty}</strong>
              </label>
            ) : (
              <div className="pick-label">
                <span className="pick-text"><strong>{itemName(t, it)}</strong><span>{itemSize(t, it)}</span></span>
                <strong className="qty">× {it.qty}</strong>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="callout plain"><div><strong>{t('totalHarvest')}</strong><p>{totals}</p></div></div>
      {o.status !== 'new' && <OrderTimeline t={t} order={o} />}
      <Sheet
        open={decline} onClose={() => setDecline(false)} title={t('declineTitle')}
        footer={<><Button kind="outline" onClick={() => setDecline(false)}>{t('cancel')}</Button><Button kind="danger" disabled={!reason} onClick={confirmDecline}>{t('declineConfirm')}</Button></>}
      >
        <p className="body-text">{t('declineText')}</p>
        <div className="cards tight" role="radiogroup" aria-label={t('declineTitle')}>
          {[['stock', 'reasonStock'], ['area', 'reasonArea'], ['other', 'reasonOther']].map(([id, k]) => (
            <button key={id} type="button" role="radio" aria-checked={reason === id} className={`opt simple ${reason === id ? 'is-on' : ''}`} onClick={() => setReason(id)}>
              <span className="opt-text"><strong>{t(k)}</strong></span>
              <span className="radio" aria-hidden="true">{reason === id && <Icon name="check" size={14} />}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}

function totalsText(o, t) {
  const g = new Map()
  for (const it of o.items) {
    const cur = g.get(it.pid) || { it, base: 0 }
    cur.base += it.base
    g.set(it.pid, cur)
  }
  return [...g.values()].map(({ it, base }) => `${itemName(t, it)} ${formatStock(t, { unit: it.unit }, base)}`).join(' · ')
}

// -------------------------------------------------------------- products ----

const parseNum = (s) => {
  const n = Number(String(s).trim().replace(',', '.'))
  return Number.isFinite(n) && String(s).trim() !== '' ? n : NaN
}
const COLORS = ['#6B8E3A', '#C9803A', '#9B4F7A', '#4A7FA5']

function ProductForm({ product, onDone }) {
  const { t, productUpdate, productAdd, state } = useApp()
  const toast = useToast()
  const isNew = !product
  const [v, setV] = useState({
    name: '', unit: product?.unit || 'kg',
    price: product ? String(product.price / 100).replace('.', t.lang === 'pt' ? ',' : '.') : '',
    stock: product ? String(product.unit === 'kg' ? product.stock / 1000 : product.stock).replace('.', t.lang === 'pt' ? ',' : '.') : '',
  })
  const [err, setErr] = useState({})
  const unitWord = t(v.unit === 'kg' ? 'unKg' : v.unit === 'un' ? 'un_one' : 'bunch_one')
  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); if (err[k]) setErr({ ...err, [k]: undefined }) }

  const submit = (e) => {
    e.preventDefault()
    const er = {}
    const price = parseNum(v.price)
    const stock = parseNum(v.stock)
    if (isNew && !v.name.trim()) er.name = t('errProdName')
    if (!(price > 0)) er.price = t('errPrice')
    if (!(stock >= 0)) er.stock = t('errStock')
    setErr(er)
    if (Object.keys(er).length) { requestAnimationFrame(() => document.querySelector('.dialog [aria-invalid="true"]')?.focus()); return }
    const unit = isNew ? v.unit : product.unit
    const base = unit === 'kg' ? Math.round(stock * 1000) : Math.round(stock)
    if (isNew) {
      productAdd({ id: `c${Date.now()}`, name: v.name.trim(), cat: 'leaf', unit, price: Math.round(price * 100), stock: base, img: null, color: COLORS[allProducts(state).length % COLORS.length] })
      toast(t('productAdded'))
    } else {
      productUpdate(product.id, { price: Math.round(price * 100), stock: base })
      toast(t('productSaved'))
    }
    onDone()
  }

  return (
    <form className="form" onSubmit={submit} noValidate id="product-form">
      {isNew && <Field data-autofocus label={t('fProdName')} placeholder={t('fProdNamePh')} value={v.name} error={err.name} onChange={set('name')} autoComplete="off" />}
      {isNew && (
        <Field as="select" label={t('fUnit')} value={v.unit} onChange={set('unit')}>
          <option value="kg">{t('unitKgOpt')}</option>
          <option value="un">{t('unitUnOpt')}</option>
          <option value="bunch">{t('unitBunchOpt')}</option>
        </Field>
      )}
      <Field label={t('fPrice', { unit: unitWord })} value={v.price} error={err.price} inputMode="decimal" autoComplete="off" onChange={set('price')} data-autofocus={!isNew ? true : undefined} />
      <Field label={`${t('fStock')} (${unitWord})`} value={v.stock} error={err.stock} hint={t('stockZeroNote')} inputMode="decimal" autoComplete="off" onChange={set('stock')} />
      <Button type="submit">{t('save')}</Button>
    </form>
  )
}

export function ProducerProducts() {
  const { t, state, productUpdate } = useApp()
  const [form, setForm] = useState(null) // null | 'new' | product
  const products = allProducts(state)
  return (
    <Screen
      title={t('pProdTitle')} sub={t('pProdSub')} nav={NAV('products')}
      footer={<Button icon="plus" onClick={() => setForm('new')}>{t('newProduct')}</Button>}
    >
      <ul className="stack">
        {products.map((p) => {
          const out = isSoldOut(p)
          const name = productName(t, p)
          return (
            <li key={p.id} className={`prow ${out ? 'is-out' : ''}`}>
              <div className="prow-photo"><Photo p={p} sizes="72px" /></div>
              <button type="button" className="prow-main" onClick={() => setForm(p)}>
                <strong>{name}</strong>
                <span className={p.stock <= 0 ? 'warn-text' : 'muted-text'}>{p.stock <= 0 ? t('soldOut') : t('available', { stock: formatStock(t, p, p.stock) })}</span>
                <span className="prow-price"><b>{t.money(p.price)}</b> {unitSuffix(t, p)}</span>
                <span className="sr-only">{t('editProduct')}</span>
              </button>
              <Switch label={`${t('availToggle')}: ${name}`} checked={!out} disabled={p.stock <= 0} onChange={(v) => productUpdate(p.id, { available: v })} />
            </li>
          )
        })}
      </ul>
      <Sheet open={!!form} onClose={() => setForm(null)} title={form === 'new' ? t('newProduct') : form ? `${t('editProduct')} · ${productName(t, form)}` : ''}>
        {form && <ProductForm key={form === 'new' ? 'new' : form.id} product={form === 'new' ? null : form} onDone={() => setForm(null)} />}
      </Sheet>
    </Screen>
  )
}
