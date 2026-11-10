import React, { useState, useEffect, useRef } from 'react'

const P = {
  home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  file: ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
  tasks: ['m3 17 2 2 4-4', 'm3 7 2 2 4-4', 'M13 6h8', 'M13 12h8', 'M13 18h8'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  pin: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  shield: ['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'],
  template: ['M4 3h16a1 1 0 0 1 1 1v6H3V4a1 1 0 0 1 1-1z', 'M3 14h9v7H4a1 1 0 0 1-1-1z', 'M16 14h5v6a1 1 0 0 1-1 1h-4z'],
  phone: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M12 18h.01'],
  bell: ['M10.268 21a2 2 0 0 0 3.464 0', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'],
  search: ['m21 21-4.34-4.34', 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16'],
  globe: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20', 'M2 12h20'],
  sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  chev: ['m6 9 6 6 6-6'], back: ['m15 18-6-6 6-6'], plus: ['M5 12h14', 'M12 5v14'],
  download: ['M12 15V3', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5'],
  cal: ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 10h18'],
  lock: ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  sprout: ['M7 20h10', 'M10 20c5.5-2.5.8-6.4 3-10', 'M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z', 'M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z'],
  logout: ['m16 17 5-5-5-5', 'M21 12H9', 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'],
  x: ['M18 6 6 18', 'm6 6 12 12'], user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8'],
  layout: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'], grip: ['M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01'],
  resize: ['M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'], check: ['M20 6 9 17l-5-5'], panel: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M9 3v18'], menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'], pencil: ['M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z'],
}
export const Icon = ({ n, size = 20, sw = 2, style }) => (
  <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={n === 'grip' ? 3 : sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {P[n].map((d, i) => <path key={i} d={d} />)}
  </svg>
)

export function Menu({ label, icon, items, value, onPick, end, kind = 'secondary', disabled, trailing = 'chev' }) {
  const [open, setOpen] = useState(false); const ref = useRef()
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
  return (
    <div className="menuwrap" ref={ref}>
      <button className={`btn ${kind}`} disabled={disabled} style={disabled ? { opacity: .55, cursor: 'not-allowed' } : null} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {icon && <Icon n={icon} />}<span className="lbl">{label}</span><Icon n={disabled ? 'lock' : trailing} size={18} />
      </button>
      {open && <div className={`menu ${end ? 'end' : ''}`} role="menu">
        {items.map((it, i) => it === '-' ? <hr key={i} /> :
          <button key={it.value} role="menuitemradio" aria-checked={value === it.value} onClick={() => { setOpen(false); onPick(it.value) }}>
            <span className="check">{value === it.value && <Icon n="check" size={16} />}</span>{it.icon && <Icon n={it.icon} size={18} />}{it.label}
          </button>)}
      </div>}
    </div>
  )
}

export const Switch = ({ on, onChange, disabled, label }) => (
  <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange && onChange(!on)} />
)

export const Kpis = ({ items }) => (
  <div className="kpis">{items.map(([l, v, d, neg, dot]) => (
    <div className="card kpi" key={l}>
      <div className="label row" style={{ gap: 8 }}>{dot && <span style={{ width: 10, height: 10, borderRadius: 2, background: dot }} />}{l}</div>
      <div className="value">{v}</div>
      {d && <div className={`faint ${neg ? '' : 'ok'}`} style={neg ? null : { color: 'var(--success)' }}>{d}</div>}
    </div>))}</div>
)

export const Table = ({ cols, rows, onRow, color }) => {
  const L = cols.map((c, j) => String(c) === '#' ? 0 : Math.min(28, Math.max(String(c).length > 2 ? 10 : 3, String(c).length, ...rows.map(r => String(r[j]).length))))
  const T = L.reduce((a, b) => a + b, 0), nHash = cols.filter(c => String(c) === '#').length
  return <table className="fit"><colgroup>{L.map((l, j) => <col key={j} style={{ width: l ? `calc((100% - ${nHash * 44}px) * ${l / T})` : '44px' }} />)}</colgroup>
    <thead><tr>{cols.map((c, j) => <th key={j} title={String(c)}>{c}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className={onRow ? 'click' : ''} tabIndex={onRow ? 0 : undefined} onClick={onRow ? () => onRow(i) : undefined} onKeyDown={onRow ? e => e.key === 'Enter' && onRow(i) : undefined}>
      {r.map((c, j) => <td key={j} title={typeof c === 'string' ? c : undefined} style={color ? color(c, j) : null}>{c}</td>)}</tr>)}</tbody></table>
}

// ---------- charts (SVG, token colors) ----------
export function Bars({ rows, max, fmt = v => v, hi = 0 }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
    {rows.map(([l, v, extra], i) => (
      <div key={l} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', alignItems: 'center', gap: 12, fontSize: 13 }}>
        <span style={{ color: 'var(--text2)' }}>{l}</span>
        <div style={{ height: 20, borderRadius: 4, background: 'var(--subtle)', overflow: 'hidden' }}><div style={{ width: `${v / max * 100}%`, height: '100%', borderRadius: 4, background: i === hi ? 'var(--brand-dk)' : 'var(--brand)' }} /></div>
        <span style={{ fontFamily: 'var(--f-text)', fontWeight: 500, minWidth: 80, textAlign: 'end' }}>{fmt(v)}{extra ? `  (${extra})` : ''}</span>
      </div>))}
  </div>
}
export function Donut({ segs, center, sub }) {
  let a = -Math.PI / 2; const R = 90, r = 56, C = 100
  const arc = p => { const a2 = a + p * 2 * Math.PI - 0.02; const L = a2 - a > Math.PI ? 1 : 0
    const pt = (rad, ang) => [C + rad * Math.cos(ang), C + rad * Math.sin(ang)]
    const [x1, y1] = pt(R, a), [x2, y2] = pt(R, a2), [x3, y3] = pt(r, a2), [x4, y4] = pt(r, a)
    const d = `M${x1} ${y1}A${R} ${R} 0 ${L} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${L} 0 ${x4} ${y4}Z`; a = a2 + 0.02; return d }
  return <div style={{ display: 'flex', gap: 24, alignItems: 'center', height: '100%' }}>
    <svg viewBox="0 0 200 200" width="180" height="180" style={{ flex: 'none' }}>
      {segs.map(s => <path key={s[0]} d={arc(s[1] / 100)} fill={s[2]} />)}
      <text x="100" y="100" textAnchor="middle" style={{ font: '600 28px var(--f-display)', fill: 'var(--text)' }}>{center}</text>
      <text x="100" y="124" textAnchor="middle" style={{ font: '12px var(--f-text)', fill: 'var(--text3)' }}>{sub}</text>
    </svg>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
      {segs.map(s => <div key={s[0]} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: s[2] }} /><span style={{ flex: 1, color: 'var(--text2)' }}>{s[0]}</span><b style={{ fontWeight: 500 }}>{s[3] ?? s[1] + '%'}</b></div>)}
    </div></div>
}
export function Lines({ series, labels, max, yl }) {
  const W = 500, H = 200
  return <svg viewBox={`0 -14 ${W} ${H + 40}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
    {yl.map((t, i) => { const y = i * H / (yl.length - 1); return <g key={t}><line x1="40" x2={W} y1={y} y2={y} stroke="var(--subtle)" /><text x="0" y={y + 4} style={{ font: '11px var(--f-text)', fill: 'var(--text3)' }}>{t}</text></g> })}
    {series.map(([n, c, v]) => <polyline key={n} fill="none" stroke={c} strokeWidth="2.5" vectorEffect="non-scaling-stroke" points={v.map((p, i) => `${40 + i * (W - 40) / (v.length - 1)},${H - p / max * H}`).join(' ')} />)}
    {labels.map((l, i) => <text key={l} x={40 + i * (W - 40) / (labels.length - 1)} y={H + 18} textAnchor="middle" style={{ font: '11px var(--f-text)', fill: 'var(--text3)' }}>{l}</text>)}
  </svg>
}
const nice = v => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1)))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p }
const kfmt = v => v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : String(v)
export function Lifecycle({ data, labels, colors, legend }) {
  const W = 600, H = 220, bw = 40
  const pos = nice(Math.max(...data.map(d => d[0] + d[1] + d[2])) * 1.05), neg = nice(Math.max(...data.map(d => d[3] + d[4])) * 1.05)
  const zero = H * pos / (pos + neg), sc = H / (pos + neg)
  const ticks = [[kfmt(pos), 0], [kfmt(pos / 2), zero / 2], ['0', zero], ['−' + kfmt(neg), H]]
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
    {legend && <div className="legend">{legend.map((l, i) => <span key={l}><i style={{ background: colors[i] }} />{l}</span>)}</div>}
    <svg viewBox={`0 -12 ${W} ${H + 36}`} width="100%" style={{ flex: 1, minHeight: 0 }} preserveAspectRatio="none">
    {ticks.map(([t, y]) => <g key={t}><line x1="44" x2={W} y1={y} y2={y} stroke="var(--subtle)" /><text x="0" y={y + 4} style={{ font: '11px var(--f-text)', fill: 'var(--text3)' }}>{t}</text></g>)}
    {data.map((d, i) => { const cx = 44 + (i + .5) * (W - 44) / data.length - bw / 2; let y = zero; const els = []
      ;[[1, colors[1]], [0, colors[0]], [2, colors[2]]].forEach(([k, c]) => { const h = d[k] * sc; y -= h; els.push(<rect key={'p' + k} x={cx} y={y} width={bw} height={Math.max(0, h - 1)} rx="3" fill={c} />) })
      y = zero + 1;[[3, colors[3]], [4, colors[4]]].forEach(([k, c]) => { const h = d[k] * sc; els.push(<rect key={'n' + k} x={cx} y={y} width={bw} height={Math.max(0, h - 1)} rx="3" fill={c} />); y += h })
      return <g key={i}>{els}<text x={cx + bw / 2} y={H + 18} textAnchor="middle" style={{ font: '11px var(--f-text)', fill: 'var(--text3)' }}>{labels[i]}</text></g> })}
  </svg></div>
}
