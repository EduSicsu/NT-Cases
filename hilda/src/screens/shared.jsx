import { FAIR_DAYS, POINT_DAYS, fromIso, formatWeight, productName, sizeLabel } from '../data.js'
import { Icon } from '../ui.jsx'

export const MODE_ICON = { fair: 'store', point: 'pin', home: 'truck' }
export const MODE_KEY = { fair: 'optFair', point: 'optPoint', home: 'optHome' }

export const itemName = (t, it) => it.name[t.lang] || it.name.pt
export const itemSize = (t, it) => sizeLabel(t, { unit: it.unit }, it.size)

/** "Feira da Banana · Sat, Nov 14, 7am–12pm" / home address. */
export function wherewhen(t, o) {
  if (o.mode === 'home') {
    const a = o.address || {}
    return [`${a.street || ''}, ${a.number || ''}`.replace(/^, |, $/g, ''), a.district, t('homeDesc')].filter(Boolean).join(' · ')
  }
  const day = o.slot ? t.day(fromIso(o.slot)) : ''
  return o.mode === 'fair'
    ? `${t('fairPlace')} · ${day}, ${t('fairHours')}`
    : `${t('pointPlace')} · ${day}, ${t('pointHours')}`
}

export const slotDays = (mode) => (mode === 'point' ? POINT_DAYS : FAIR_DAYS)

export function statusKey(o) {
  const pick = o.mode === 'home' ? 'home' : 'pickup'
  switch (o.status) {
    case 'ready': return `st_ready_${pick}`
    case 'done': return `st_done_${pick}`
    default: return `st_${o.status}`
  }
}

const TONE = { new: 'warn', preparing: 'info', ready: 'ok', done: 'ok', declined: 'bad', cancelled: 'muted' }
const ICON = { new: 'refresh', preparing: 'basket', ready: 'check', done: 'check', declined: 'x', cancelled: 'x' }

export function StatusChip({ t, order, producer }) {
  let label = t(statusKey(order))
  if (producer && order.status === 'new') label = t('tabNew')
  if (producer && order.status === 'declined') label = t('declinedBy')
  if (producer && order.status === 'cancelled') label = t('cancelledBy')
  return (
    <span className={`status status-${TONE[order.status]}`}>
      <Icon name={ICON[order.status]} size={14} />
      {label}
    </span>
  )
}

export function OrderTimeline({ t, order }) {
  if (order.status === 'declined' || order.status === 'cancelled') {
    const reasons = { stock: 'reasonStock', area: 'reasonArea', other: 'reasonOther' }
    const reason = order.reason ? t(reasons[order.reason] || 'reasonOther') : ''
    return (
      <div className={`status-card status-${TONE[order.status]}`} role="status">
        <Icon name="x" size={22} />
        <div>
          <strong>{t(statusKey(order))}</strong>
          <p>{order.status === 'declined' ? t('sd_declined', { reason }) : t('sd_cancelled')}</p>
        </div>
      </div>
    )
  }
  const pick = order.mode === 'home' ? 'home' : 'pickup'
  const now = { new: 1, preparing: 1, ready: 2, done: 4 }[order.status]
  const sentAt = order.history[0]?.at
  const steps = [
    { title: t('step_sent'), desc: sentAt ? `${t.day(new Date(sentAt))}, ${t.time(new Date(sentAt))}` : '' },
    { title: order.status === 'new' ? t('st_new') : t('step_prep'), desc: order.status === 'new' ? t('sd_new') : t('sd_preparing') },
    { title: t(`step_ready_${pick}`), desc: t(`sd_ready_${pick}`) },
    { title: t(`step_done_${pick}`), desc: t('sd_done') },
  ]
  return (
    <ol className="timeline" aria-label={t('progress')}>
      {steps.map((s, i) => {
        const state = i < now ? 'done' : i === now ? 'now' : 'todo'
        return (
          <li key={i} className={`tl tl-${state}`} aria-current={state === 'now' ? 'step' : undefined}>
            <span className="tl-dot" aria-hidden="true">{state === 'done' ? <Icon name="check" size={14} /> : state === 'now' ? <span className="tl-pulse" /> : null}</span>
            <span className="tl-text"><strong>{s.title}</strong><span>{s.desc}</span></span>
          </li>
        )
      })}
    </ol>
  )
}

export function Summary({ t, rows, total }) {
  return (
    <dl className={`summary ${rows.length ? '' : 'only-total'}`}>
      {rows.map(([k, v]) => (
        <div key={k} className="sum-row"><dt>{k}</dt><dd>{v}</dd></div>
      ))}
      {total && <div className="sum-row is-total"><dt>{total[0]}</dt><dd>{total[1]}</dd></div>}
    </dl>
  )
}

export function itemsLine(t, order, max = 3) {
  const names = order.items.map((i) => itemName(t, i))
  return names.length > max ? `${names.slice(0, max).join(', ')}…` : names.join(', ')
}

export { formatWeight, productName }
