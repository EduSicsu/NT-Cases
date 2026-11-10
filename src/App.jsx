import React, { useState, useEffect } from 'react'
import { LANGS, makeT } from './i18n.js'
import { Icon, Menu, Switch, Kpis, Table, Bars, Donut, Lines, Lifecycle } from './ui.jsx'

const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} } }
const FARMS = ['Pennsylvania', 'Colorado', 'New York', 'Kansas']
const money = v => '$' + v.toLocaleString('en-US')
const toast = msg => window.dispatchEvent(new CustomEvent('sf-toast', { detail: msg }))
function Toaster({ t }) {
  const [m, setM] = useState(null)
  useEffect(() => { let id; const show = msg => { setM(msg); clearTimeout(id); id = setTimeout(() => setM(null), 2600) }
    const h = e => show(e.detail); const c = e => { if (e.target.closest && e.target.closest('[data-soon]')) { e.preventDefault(); show(t('Not in the prototype yet')) } }
    window.addEventListener('sf-toast', h); document.addEventListener('click', c); return () => { window.removeEventListener('sf-toast', h); document.removeEventListener('click', c) } }, [t])
  return <div className="toast-wrap" aria-live="polite" role="status">{m && <div className="toast"><Icon n="check" size={18} />{m}</div>}</div>
}
const farmTitle = (t, farm) => t('{x} farm').replace('{x}', t(farm))
function SetRow({ l, d = true, onDirty }) { const [v, setV] = useState(d); return <div className="setting"><span className="txt">{l}</span><Switch on={v} onChange={x => { setV(x); onDirty && onDirty() }} label={l} /></div> }

export default function App() {
  const [lang, setLang] = useState(store.get('lang', 'en'))
  const [theme, setTheme] = useState(store.get('theme', 'light'))
  const [role, setRole] = useState(store.get('role', null))
  const [route, setRoute] = useState('overview')
  const t = makeT(lang)
  useEffect(() => { document.documentElement.dir = LANGS[lang].dir; document.documentElement.lang = lang; store.set('lang', lang) }, [lang])
  useEffect(() => { document.documentElement.dataset.theme = theme; store.set('theme', theme) }, [theme])
  useEffect(() => { store.set('role', role) }, [role])
  const prefs = { lang, setLang, theme, setTheme, t }
  return <>{!role ? <Login {...prefs} onLogin={r => { setRole(r); setRoute('overview') }} /> : <Shell {...prefs} role={role} route={route} go={setRoute} signOut={() => setRole(null)} />}<Toaster t={t} /></>
}

function LangMenu({ lang, setLang, end }) {
  return <Menu end={end} icon="globe" label={LANGS[lang].label} value={lang} onPick={setLang} items={Object.entries(LANGS).map(([k, v]) => ({ value: k, label: v.label }))} />
}

// ---------------- LOGIN ----------------
function Login({ t, lang, setLang, theme, setTheme, onLogin }) {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(null)
  const submit = e => { e.preventDefault(); const v = email.trim().toLowerCase(); if (!v) setErr('empty'); else if (v.includes('manager')) onLogin('manager'); else if (v.includes('employee')) onLogin('employee'); else setErr('bad') }
  return <div className="login">
    <div className="panel">
      <div className="row display" style={{ fontSize: 20, fontWeight: 500 }}><img src="/logo.svg" alt="" width="36" height="36" className="logo" />{t('Schrute Farms')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><h1>{t('From field to customer, in one view.')}</h1><p style={{ margin: 0, fontSize: 16, maxWidth: 520 }}>{t('Sales, people and day-to-day operations across every Schrute farm, updated in real time.')}</p></div>
      <div className="row" style={{ gap: 40 }}>{[['4', 'farms'], ['18,420', 'app clients'], ['1,260', 'team members']].map(([v, l]) => <div key={l}><div className="display" style={{ fontSize: 20, fontWeight: 500 }}>{v}</div><div style={{ fontSize: 12 }}>{t(l)}</div></div>)}</div>
    </div>
    <div className="side">
      <div className="row" style={{ justifyContent: 'flex-end' }}><ThemeBtn theme={theme} setTheme={setTheme} t={t} /><LangMenu lang={lang} setLang={setLang} end /></div>
      <form onSubmit={submit} style={{ alignSelf: 'center' }}>
        <h1>{t('Sign in')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('Managers and employees use the same sign-in. What you see depends on your role.')}</p>
        <div className="hint demo"><b>{t('Demo')}</b> {t('Prototype: type “manager” or “employee” as the email, any password.')}</div>
        <div className="field"><label htmlFor="em">{t('Work email')}</label><input id="em" autoFocus value={email} onChange={e => { setEmail(e.target.value); setErr(null) }} placeholder="manager · employee" dir="ltr" aria-invalid={!!err} aria-describedby={err ? 'em-err' : undefined} />{err && <div className="err" id="em-err" role="alert">{t(err === 'empty' ? 'Enter your work email.' : 'Type “manager” or “employee” to choose a path.')}</div>}</div>
        <div className="field"><label htmlFor="pw">{t('Password')}</label><input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={t('Enter your password')} /></div>
        <button type="button" className="btn text inline-link" style={{ alignSelf: 'flex-start' }} data-soon>{t('Forgot password?')}</button>
        <button className="btn primary block" type="submit">{t('Sign in')}</button>
        <div className="or">{t('or')}</div>
        <button type="button" className="btn secondary block" data-soon><Icon n="shield" />{t('Sign in with company SSO')}</button>
      </form>
      <div className="row faint" style={{ justifyContent: 'space-between' }}><span>{t('New to Schrute Farms? Ask your farm manager for an invite.')}</span><span>{t('Privacy · Terms')}</span></div>
    </div>
  </div>
}
const ThemeBtn = ({ theme, setTheme, t }) => <button className="iconbtn" aria-label={t('Theme')} title={t(theme === 'light' ? 'Dark' : 'Light')} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon n={theme === 'light' ? 'moon' : 'sun'} /></button>

// ---------------- SHELL ----------------
function Shell({ t, lang, setLang, theme, setTheme, role, route, go, signOut }) {
  const mgr = role === 'manager'
  const [farm, setFarm] = useState(mgr ? 'Pennsylvania' : 'Pennsylvania')
  const [sheet, setSheet] = useState(null); const [dialog, setDialog] = useState(false)
  const [tasks, setTasks] = useState(() => store.get('tasks', null) || TASKS0)
  useEffect(() => { store.set('tasks', tasks) }, [tasks])
  const setStatus = (name, st) => setTasks(ts => ts.map(x => x.task === name ? { ...x, st } : x))
  const main = mgr ? [['overview', 'Overview', 'home'], ['forms', 'Forms', 'file'], ['tasks', 'Tasks', 'tasks'], ['accounts', 'Accounts', 'users']]
    : [['overview', 'Overview', 'home'], ['tasks', 'My tasks', 'tasks'], ['forms', 'My forms', 'file']]
  const settings = [['s-farms', 'Farms & locations', 'pin'], ['s-roles', 'Roles & permissions', 'shield'], ['s-templates', 'Form templates', 'template'], ['s-app', 'App settings', 'phone'], ['s-notif', 'Notifications', 'bell']]
  const [open, setOpen] = useState(true)
  const [formIdx, setFormIdx] = useState(0)
  const ctx = { t, mgr, farm, setFarm, go, formIdx, openForm: i => { setFormIdx(i); go('form') }, openTask: setSheet, newTask: () => setDialog(true), tasks }
  const page = {
    overview: mgr ? <MgrOverview {...ctx} /> : <EmpOverview {...ctx} />,
    forms: mgr ? <FormsPage {...ctx} /> : <EmpForms {...ctx} />, form: <FormDetail {...ctx} />,
    tasks: <TasksPage {...ctx} />, accounts: <AccountsPage {...ctx} />,
    's-farms': <FarmsPage {...ctx} />, 's-roles': <RolesPage {...ctx} />, 's-templates': <TemplatesPage {...ctx} />, 's-app': <AppSettings {...ctx} />, 's-notif': <NotifPage {...ctx} />,
  }[route]
  const [collapsed, setCollapsed] = useState(() => store.get('nav-collapsed', window.innerWidth < 1100))
  const [drawer, setDrawer] = useState(false)
  useEffect(() => { store.set('nav-collapsed', collapsed) }, [collapsed])
  const goto = k => { go(k); setDrawer(false) }
  const Nav = ({ rail }) => <nav className={`nav ${rail ? 'rail' : ''}`} aria-label="Main">
    <div className="brand"><img src="/logo.svg" alt="" width="32" height="32" className="logo" /><span className="txt">{t('Schrute Farms')}</span>
      <button className="iconbtn toggle" onClick={() => drawer ? setDrawer(false) : setCollapsed(c => !c)} aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!rail} title={rail ? 'Expand sidebar' : 'Collapse sidebar'}><Icon n={drawer ? 'x' : 'panel'} /></button></div>
    <div className="group">{t('WORKSPACE')}</div>
    {main.map(([k, l, ic]) => <button key={k} title={t(l)} className={`nav-item ${route === k || (k === 'forms' && route === 'form') ? 'on' : ''}`} onClick={() => goto(k)} aria-current={route === k}><Icon n={ic} /><span className="txt">{t(l)}</span></button>)}
    {mgr && <><hr /><button className="nav-item disclosure" title={t('Workspace settings')} onClick={() => rail ? setCollapsed(false) : setOpen(o => !o)} aria-expanded={open}><span className="txt">{t('Workspace settings')}</span><Icon n="chev" size={18} style={{ transform: open ? 'rotate(180deg)' : '' }} /></button>
      {(open || rail) && settings.map(([k, l, ic]) => <button key={k} title={t(l)} className={`nav-item sub ${route === k ? 'on' : ''}`} onClick={() => goto(k)}><Icon n={ic} /><span className="txt">{t(l)}</span></button>)}</>}
  </nav>
  return <div className="shell">
    <Nav rail={collapsed} />
    {drawer && <><div className="scrim" onClick={() => setDrawer(false)} /><div className="drawer"><Nav rail={false} /></div></>}
    <main className="workspace">
      <div className="topbar">
        <button className="iconbtn burger" onClick={() => setDrawer(true)} aria-label="Open menu"><Icon n="menu" /></button>
        <label className="search"><Icon n="search" size={18} /><input className="trunc" type="search" aria-label={t('Search fields, varieties, workers…')} placeholder={t('Search fields, varieties, workers…')} onKeyDown={e => e.key === 'Enter' && toast(t('Not in the prototype yet'))} /></label><div className="spacer" />
        <ThemeBtn theme={theme} setTheme={setTheme} t={t} /><LangMenu lang={lang} setLang={setLang} end />
        <button className="iconbtn" aria-label={t('Notifications')} data-soon><Icon n="bell" /></button>
        <Menu end kind="text" icon="user" label={mgr ? 'Aline · ' + t('Manager') : 'Rafael · ' + t('Employee')} value="" onPick={v => v === 'out' && signOut()} items={[{ value: 'acc', label: t('My account'), icon: 'user' }, '-', { value: 'out', label: t('Sign out'), icon: 'logout' }]} />
      </div>
      <div className="body">{page}</div>
    </main>
    {sheet && <TaskSheet t={t} task={tasks.find(x => x.task === sheet) || { task: sheet, loc: 'Field North · Pennsylvania', who: 'Rafael Moura', due: 'Today', st: 'To do' }} onSave={st => { setStatus(sheet, st); toast(t('Changes saved')) }} close={() => setSheet(null)} />}
    {dialog && <NewTask t={t} close={() => setDialog(false)} onCreate={x => { setTasks(ts => [x, ...ts]); toast(t('Task created')) }} />}
  </div>
}

const Heading = ({ title, desc, chip, children }) => <div className="heading"><div className="intro"><h1>{title}</h1>{desc && <div className="muted">{desc}</div>}{chip && <span className="chip"><Icon n="shield" size={14} />{chip}</span>}</div><div className="actions">{children}</div></div>

// ---------------- BENTO ----------------
// Drag the grip (top-left) to move a widget; drag the corner handle (bottom-right) to resize. Both snap to the 4-column × 168px grid.
function Widget({ w, t, editing, onGrip, onResize, dragging }) {
  return <div data-wid={w.id} className={`card widget c${w.c} r${w.r} ${dragging ? 'dragging' : ''}`} style={{ gridColumn: `span ${w.c}`, gridRow: `span ${w.r}` }}>
    <div className="whead"><button className="handle grip" aria-label={`Move ${t(w.title)}`} title="Drag to move" onPointerDown={e => onGrip(e, w.id)}><Icon n="grip" size={18} /></button><div className="titles"><h2>{t(w.title)}</h2><div className="muted">{t(w.sub)}</div></div>
      {w.range && <button className="btn secondary sm" data-soon>{t(w.range)}<Icon n="chev" size={16} /></button>}</div>
    <div className="chart">{w.body}</div>
    <button className="handle resize" aria-label={`Resize ${t(w.title)}`} title="Drag to resize" onPointerDown={e => onResize(e, w)}><Icon n="resize" size={16} /></button>
  </div>
}
function Bento({ t, items, id }) {
  const [order, setOrder] = useState(() => store.get('bento-' + id, null))
  const [editing, setEditing] = useState(false)
  const [dragId, setDragId] = useState(null)
  const gridRef = React.useRef()
  const base = Object.fromEntries(items.map(i => [i.id, i]))
  const list = (order ?? items.map(i => ({ id: i.id, c: i.c, r: i.r }))).filter(o => base[o.id]).map(o => ({ ...base[o.id], c: o.c, r: o.r }))
  const save = (l, persist = true) => { const s = l.map(({ id, c, r }) => ({ id, c, r })); setOrder(s); if (persist) store.set('bento-' + id, s) }
  const cols = () => getComputedStyle(gridRef.current).gridTemplateColumns.split(' ').length
  const onResize = (e, w) => {
    e.preventDefault(); const g = gridRef.current, n = cols(), gap = 16
    const colW = (g.clientWidth - gap * (n - 1)) / n, rowH = 168 + gap, rtl = document.documentElement.dir === 'rtl'
    const sx = e.clientX, sy = e.clientY, c0 = Math.min(w.c, n), r0 = w.r; let cur = list
    const move = ev => { const dx = (ev.clientX - sx) * (rtl ? -1 : 1), dy = ev.clientY - sy
      const c = Math.max(1, Math.min(n, c0 + Math.round(dx / colW))), r = Math.max(1, Math.min(4, r0 + Math.round(dy / rowH)))
      cur = cur.map(x => x.id === w.id ? { ...x, c, r } : x); save(cur, false) }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); save(cur) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }
  const onGrip = (e, wid) => {
    e.preventDefault(); setDragId(wid); let cur = list
    const move = ev => { const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-wid]'); const to = el?.dataset.wid
      if (!to || to === wid) return; const l = [...cur]; const a = l.findIndex(x => x.id === wid), b = l.findIndex(x => x.id === to); const [m] = l.splice(a, 1); l.splice(b, 0, m); cur = l; save(l, false) }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setDragId(null); save(cur) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }
  return <>
    <div className="row" style={{ justifyContent: 'flex-end', marginBottom: -8 }}>
      {editing && <button className="btn text sm" onClick={() => { setOrder(null); store.set('bento-' + id, null) }}>Reset</button>}
      <button className={`btn ${editing ? 'primary' : 'secondary'} sm`} onClick={() => setEditing(e => !e)}><Icon n="layout" size={18} />{t(editing ? 'Done' : 'Customize layout')}</button>
    </div>
    <div ref={gridRef} className={`bento ${editing || dragId ? 'editing' : ''}`}>{list.map(w => <Widget key={w.id} w={w} t={t} onGrip={onGrip} onResize={onResize} dragging={dragId === w.id} />)}</div>
  </>
}

// ---------------- MANAGER OVERVIEW ----------------
const SALES = { Pennsylvania: [412300, 9840, 41.9, 1.4, [330, 350, 360, 372, 368, 412]], Colorado: [286900, 7120, 40.3, 2.8, [220, 230, 250, 262, 266, 287]], 'New York': [498150, 11210, 44.4, 3.1, [310, 340, 380, 400, 412, 498]], Kansas: [221400, 5640, 39.3, 2.2, [240, 236, 230, 228, 226, 221]] }
const PRODUCTS = { Pennsylvania: [['Red beets · 5 lb', 96400, '1.2%'], ['Golden beets · 5 lb', 41800, '0.9%'], ['Beet chips · 8 oz', 28600, '0.6%'], ['Pickled beets · jar', 19900, '2.3%']], Colorado: [['Whole milk · 1 gal', 81250, '1.8%'], ['Raw milk · ½ gal', 36200, '4.9%'], ['Butter · 1 lb', 22100, '0.8%'], ['Yogurt · 32 oz', 18300, '1.1%']], 'New York': [['Free-range eggs · dozen', 74900, '2.6%'], ['Wildflower honey', 52300, '0.4%'], ['Strawberries · pint', 31800, '6.8%'], ['Apple cider · ½ gal', 22700, '1.0%']], Kansas: [['Heirloom tomatoes', 33100, '3.7%'], ['Sweet corn · dozen', 28600, '1.5%'], ['Wheat flour · 5 lb', 21900, '0.5%'], ['Sunflower oil', 14200, '0.9%']] }
const LC = { all: [[820, 9800, 410, 2600, 420], [940, 10400, 460, 2500, 380], [1010, 11000, 500, 2450, 360], [1180, 11700, 560, 2380, 340], [1240, 12240, 580, 2300, 320], [1460, 12980, 640, 2210, 310]] }
const PROFILE = {
  all: { k: 1, trend: 0, g: [18, 6, 11, -4, -3] },
  Pennsylvania: { k: .28, trend: 0, g: [18, 6, 11, -4, -3], sales: ['+12%', '+9%', '+3%', '−0.3 pts'] },
  Colorado: { k: .19, trend: -.02, g: [9, 3, 14, 7, 5], sales: ['+8%', '+6%', '+2%', '+0.4 pts'] },
  'New York': { k: .37, trend: .06, g: [27, 9, 6, -2, -1], sales: ['+21%', '+17%', '+4%', '−0.2 pts'] },
  Kansas: { k: .16, trend: -.05, g: [-4, -2, 5, 12, 9], sales: ['−2%', '−5%', '+3%', '+0.6 pts'] },
}
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
function MgrOverview({ t, farm, setFarm }) {
  const all = farm === 'all', P = all ? PROFILE.all : PROFILE[farm]
  const lc = LC.all.map((r, m) => r.map((v, j) => Math.round(v * P.k * (j < 3 ? 1 + P.trend * m : 1 - P.trend * m * .6))))
  const last = lc[5], f = n => n.toLocaleString('en-US')
  const lcCols = ['var(--brand)', 'var(--brand-dk)', 'var(--tint)', 'var(--subtle)', 'var(--text)']
  const farmItems = [{ value: 'all', label: t('All farms') }, '-', ...FARMS.map(x => ({ value: x, label: t(x) }))]
  const prods = all ? Object.entries(PRODUCTS).flatMap(([fm, p]) => p.map(x => [...x, fm])) : PRODUCTS[farm].map(x => [...x, farm])
  const top = [...prods].sort((a, b) => b[1] - a[1]).slice(0, 4), ret = [...prods].sort((a, b) => parseFloat(b[2]) - parseFloat(a[2])).slice(0, 4)
  const widgets = [
    { id: 'lc', title: 'User lifecycle', sub: 'Active users above the line, inactive below · monthly', range: '6 months', c: 4, r: 2, body: <Lifecycle data={lc} labels={MONTHS} colors={lcCols} legend={['New', 'Retained', 'Reactivated', 'Dormant', 'Churned'].map(t)} /> },
    { id: 'sales', title: all ? 'Total sales by farm' : 'Sales by product', sub: 'Gross sales through the app · Nov 2026', range: 'Month', c: 2, r: 2, body: all ? <Bars rows={FARMS.map(x => [t(x), SALES[x][0]]).sort((a, b) => b[1] - a[1])} max={500000} fmt={money} /> : <Bars rows={PRODUCTS[farm].map(p => [p[0].split(' ·')[0], p[1]])} max={PRODUCTS[farm][0][1]} fmt={money} /> },
    { id: 'top', title: 'Top-selling products', sub: 'Ranked by sales · Nov 2026', range: 'Month', c: 2, r: 2, body: <Table cols={all ? ['#', t('Product'), t('Farms'), t('Sales')] : ['#', t('Product'), t('Sales')]} rows={top.map((p, i) => all ? [i + 1, p[0], t(p[3]), money(p[1])] : [i + 1, p[0], money(p[1])])} /> },
    { id: 'ret', title: 'Highest return rates', sub: 'Returned ÷ delivered orders · Nov 2026', range: 'Month', c: 2, r: 2, body: <Table cols={all ? ['#', t('Product'), t('Farms'), t('Return rate')] : ['#', t('Product'), t('Return rate')]} rows={ret.map((p, i) => all ? [i + 1, p[0], t(p[3]), p[2]] : [i + 1, p[0], p[2]])} /> },
    { id: 'trend', title: 'Sales trend', sub: 'Monthly gross sales · Jun–Nov 2026', range: '6 months', c: 2, r: 2, body: <Lines max={500} yl={['$500k', '$250k', '$0']} labels={MONTHS} series={(all ? FARMS : [farm]).map((x, i) => [x, ['var(--brand-dk)', 'var(--brand)', 'var(--text)', 'var(--text3)'][all ? i : 0], SALES[x][4]])} /> },
  ]
  return <>
    <Heading title={all ? t('Schrute Farms') : farmTitle(t, farm)} desc={all ? t('Schrute Farms · 4 farms') : t('Schrute Farms')} chip={t('Manager · can switch to any farm or All farms')}>
      <Menu icon="pin" label={all ? t('All farms') : t(farm)} value={farm} onPick={setFarm} items={farmItems} />
      <button className="btn secondary" data-soon><Icon n="cal" />{t('Season 2026/27')}</button>
      <button className="btn primary" data-soon><Icon n="download" />{t('Export')}</button>
    </Heading>
    <div className="section-title"><h2>{t('App · user lifecycle')}</h2><div className="muted">{t('Active users split into new, retained and reactivated; inactive users into dormant and churned.')}</div></div>
    <Kpis items={[['New', 0], ['Retained', 1], ['Reactivated', 2], ['Dormant', 3], ['Churned', 4]].map(([l, i]) => [t(l), f(last[i]), (P.g[i] < 0 ? '−' : '+') + Math.abs(P.g[i]) + '% ' + t('vs. Oct'), i > 2 ? P.g[i] > 0 : P.g[i] < 0, lcCols[i]])} />
    <div className="section-title"><h2>{t('Farms · sales performance')}</h2><div className="muted">{t('Sales made through the app. Whatever each farm sells — beets, milk, eggs or anything else.')}</div></div>
    <Kpis items={all ? FARMS.map(x => [t(x), money(SALES[x][0]), (x === 'Kansas' ? '−2%' : '+' + { Pennsylvania: 12, Colorado: 8, 'New York': 21 }[x] + '%') + ' ' + t('vs. Oct'), x === 'Kansas'])
      : [[t('Total sales'), money(SALES[farm][0]), P.sales[0] + ' ' + t('vs. Oct'), P.sales[0][0] === '−'], [t('Orders'), f(SALES[farm][1]), P.sales[1] + ' ' + t('vs. Oct'), P.sales[1][0] === '−'], [t('Average order value'), '$' + SALES[farm][2].toFixed(2), P.sales[2] + ' ' + t('vs. Oct')], [t('Return rate'), SALES[farm][3] + '%', P.sales[3], P.sales[3][0] === '+']]} />
    <Bento t={t} items={widgets} id={'mgr'} />
  </>
}

// ---------------- EMPLOYEE ----------------
const MY_TASKS = [['Harvest Field North · rows 12–18', 'Today', 'Due today'], ['Load beets for Packing House', 'Today', 'Due today'], ['Tractor 3 · oil check', 'Tue 10', 'To do'], ['Clean harvester blades', 'Wed 11', 'To do'], ['Fuel log · week 45', 'Fri 6', 'Done']]
const MY_FORMS = [['Daily harvest log', 'Yesterday', 'Submitted'], ['Machinery check', 'Nov 4', 'Overdue'], ['Safety training', 'Oct 28', 'Submitted'], ['Field incident report', '—', 'Not started']]
const stColor = v => ({ color: /Done|Submitted|Concluí|Enviado|منجزة|مُرسل|Ativo|Live|نشط/.test(v) ? 'var(--success)' : /today|Overdue|hoje|Atrasado|اليوم|متأخر/i.test(v) ? 'var(--text)' : 'var(--text3)', fontWeight: /today|Overdue|hoje|Atrasado|اليوم|متأخر/i.test(v) ? 500 : 400 })
function EmpOverview({ t, go, openTask }) {
  return <>
    <Heading title={t('Good morning, Rafael')} desc={t('Tractor operator · Pennsylvania farm · Monday, 9 November')} chip={t('Employee · Pennsylvania only')}>
      <Menu icon="pin" label={t('Pennsylvania')} disabled items={[]} />
    </Heading>
    <Kpis items={[[t('Open tasks'), '5', t('2 due today'), true], [t('Forms to fill in'), '3', t('1 overdue'), true], [t('Farm orders today'), '312', t('+8% vs. last Monday')]]} />
    <div className="board" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="card"><h2>{t('My tasks')}</h2><div className="muted">{t('Assigned to you · this week')}</div>
        <Table cols={[t('Task'), t('Due'), t('Status')]} rows={MY_TASKS.map(r => [r[0], t(r[1]), t(r[2])])} color={(c, j) => j === 2 ? stColor(c) : null} onRow={i => openTask(MY_TASKS[i][0])} /></div>
      <div className="card"><h2>{t('My forms')}</h2><div className="muted">{t('Forms you fill in or review')}</div>
        <Table cols={[t('Form'), t('Last entry'), t('Status')]} rows={MY_FORMS.map(r => [t(r[0]), t(r[1]), t(r[2])])} color={(c, j) => j === 2 ? stColor(c) : null} /></div>
    </div>
  </>
}
function EmpForms({ t }) {
  return <><Heading title={t('My forms')} desc={t('Forms you fill in or review')} chip={t('Employee · Pennsylvania only')} />
    <div className="card"><Table cols={[t('Form'), t('Last entry'), t('Status')]} rows={MY_FORMS.map(r => [t(r[0]), t(r[1]), t(r[2])])} color={(c, j) => j === 2 ? stColor(c) : null} /></div></>
}

// ---------------- FORMS ----------------
const FORMS = [['App client sign-up', 'App clients', 'All farms', '1,460', 'Aline Prado', 'Live'], ['Buyer company registration', 'App clients', 'All farms', '48', 'Samir Haddad', 'Live'], ['Daily harvest log', 'Employees', 'PA · CO · KS', '2,310', 'Aline Prado', 'Live'], ['Machinery check', 'Employees', 'All farms', '612', 'Omar Nasser', 'Live'], ['Safety training', 'Employees', 'All farms', '474', 'Lúcia Ferraz', 'Live'], ['Product return reason', 'App clients', 'All farms', '58', 'Lúcia Ferraz', 'Live'], ['Seasonal hiring', 'Employees', 'New York', '—', 'Lúcia Ferraz', 'Draft']]
function FormsPage({ t, go, openForm }) {
  return <><Heading title={t('Forms')} desc={t('Forms created by Schrute Farms. Each one collects data from employees or app clients, per farm.')}><button className="btn primary" data-soon><Icon n="plus" />{t('New form')}</button></Heading>
    <Kpis items={[[t('Live forms'), '6', '+1'], [t('Responses · 30 days'), '4,962', '+12%'], [t('Completion rate'), '87%', '+3 pts'], [t('Overdue submissions'), '14', '−5']]} />
    <div className="card"><h2>{t('All forms')}</h2><div className="muted">{t('Open a form to see its responses, new and churned respondents, and charts.')}</div>
      <Table cols={[t('Form'), t('Audience'), t('Farms'), t('Responses · 30 days'), t('Owner'), t('Status')]} rows={FORMS.map(r => [t(r[0]), t(r[1]), t(r[2]), r[3], r[4], t(r[5])])} color={(c, j) => j === 5 ? stColor(c) : null} onRow={openForm} /></div></>
}
const FIELDS = {
  'App client sign-up': [['Full name', 'Short text', 1, 99], ['Email', 'Email', 1, 99], ['Delivery area', 'Address', 1, 93], ['Preferred farm', 'Single choice', 1, 92], ['Phone', 'Phone', 0, 71], ['Marketing consent', 'Checkbox', 0, 91]],
  'Buyer company registration': [['Company name', 'Short text', 1, 100], ['Tax ID', 'Number', 1, 96], ['Products wanted', 'Multiple choice', 1, 94], ['Monthly volume', 'Number', 1, 88], ['Delivery frequency', 'Single choice', 1, 90], ['Contact person', 'Short text', 1, 98]],
  'Daily harvest log': [['Field', 'Single choice', 1, 100], ['Rows harvested', 'Number', 1, 97], ['Tonnes', 'Number', 1, 95], ['Crate count', 'Number', 1, 93], ['Issues', 'Long text', 0, 34], ['Photo', 'File', 0, 52]],
  'Machinery check': [['Machine', 'Single choice', 1, 100], ['Hours meter', 'Number', 1, 96], ['Oil level', 'Single choice', 1, 94], ['Tyres OK', 'Checkbox', 1, 94], ['Brakes OK', 'Checkbox', 1, 93], ['Notes', 'Long text', 0, 22]],
  'Safety training': [['Employee', 'Person', 1, 100], ['Course', 'Single choice', 1, 100], ['Completed on', 'Date', 1, 97], ['Signature', 'Signature', 1, 91], ['Expiry date', 'Date', 1, 89]],
  'Product return reason': [['Order number', 'Short text', 1, 100], ['Product', 'Single choice', 1, 98], ['Reason', 'Single choice', 1, 96], ['Photo', 'File', 0, 61], ['Refund or replace', 'Single choice', 1, 95]],
  'Seasonal hiring': [['Name', 'Short text', 1, 0], ['Role', 'Single choice', 1, 0], ['Start date', 'Date', 1, 0], ['Farm', 'Single choice', 1, 0]],
}
const PEOPLE = [['Hannah Park', 'Pennsylvania'], ['Diego Alvarez', 'Colorado'], ['Priya Nair', 'New York'], ['Tom Becker', 'Kansas'], ['Grace Liu', 'New York'], ['Marcus Hill', 'Pennsylvania'], ['Sofia Reyes', 'Colorado'], ['Ahmed Karim', 'New York'], ['Emma Walsh', 'Kansas'], ['Lucas Moreau', 'Pennsylvania'], ['Yuki Tanaka', 'New York'], ['Nora Jensen', 'Colorado']]
const SAMPLE = (field, i, farm, name) => ({
  'Full name': name, 'Email': name.toLowerCase().replace(' ', '.') + '@example.com', 'Delivery area': { Pennsylvania: 'Scranton, PA', Colorado: 'Boulder, CO', 'New York': 'Newburgh, NY', Kansas: 'Garden City, KS' }[farm], 'Preferred farm': farm,
  'Company name': ['Green Basket Co.', 'Hilltop Grocers', 'Union Market', 'Prairie Foods', 'Harbor Deli', 'Maple Kitchen'][i % 6], 'Tax ID': '84-' + (1000000 + i * 7919), 'Products wanted': ['Beets, eggs', 'Milk, butter', 'Honey', 'Tomatoes, corn'][i % 4], 'Monthly volume': (2 + i % 5) * 120 + ' kg',
  'Field': ['Field North', 'Field East', 'Field South', 'Packing House'][i % 4], 'Rows harvested': 6 + i % 7, 'Tonnes': (3 + (i * 7) % 9) + '.' + (i % 10) + ' t', 'Crate count': 120 + i * 13,
  'Machine': ['Tractor 3', 'Harvester 1', 'Loader 2', 'Sprayer 4'][i % 4], 'Hours meter': 1200 + i * 37 + ' h', 'Oil level': i % 5 ? 'OK' : 'Low', 'Tyres OK': i % 6 ? 'Yes' : 'No',
  'Employee': name, 'Course': ['Tractor safety', 'Chemical handling', 'First aid'][i % 3], 'Completed on': `Nov ${1 + i % 8}`, 'Signature': 'Signed',
  'Order number': '#' + (48210 + i * 3), 'Product': ['Strawberries · pint', 'Raw milk · ½ gal', 'Free-range eggs · dozen', 'Red beets · 5 lb'][i % 4], 'Reason': ['Damaged', 'Not fresh', 'Wrong item', 'Late delivery'][i % 4],
}[field] ?? '—')
const WHEN = i => i < 3 ? `Today, 0${9 - i}:${12 + i * 7}` : i < 6 ? 'Yesterday' : `Nov ${8 - Math.floor((i - 6) / 2)}`
function FormDetail({ t, go, formIdx }) {
  const [tab, setTab] = useState('Overview')
  const f = FORMS[formIdx], name = f[0], fields = FIELDS[name], draft = f[5] === 'Draft'
  const total = draft ? 0 : parseInt(f[3].replace(/,/g, '')) || 0
  const rows = draft ? [] : PEOPLE.map(([n, farm], i) => ({ name: f[1] === 'Employees' ? ['Rafael Moura', 'João Batista', 'Clara Ribeiro', 'Beatriz Lima', 'Samir Haddad', 'Omar Nasser'][i % 6] : n, farm, i }))
  const cols3 = fields.slice(0, 3).map(x => x[0])
  const cell = (r, fld) => SAMPLE(fld, r.i, r.farm, r.name)
  const byFarm = FARMS.map(x => [x, Math.round(total * { Pennsylvania: .3, Colorado: .22, 'New York': .35, Kansas: .13 }[x])])
  const nv = [32, 38, 35, 41, 44, 40, 36, 45, 48, 46, 50, 47, 44, 52, 55, 49, 53, 58, 54, 51, 57, 60, 56, 62, 59, 64, 61, 66, 63, 68]
  const widgets = [
    { id: 'time', title: 'Responses over time', sub: 'New vs. churned respondents · daily', range: '30 days', c: 3, r: 2, body: <svg viewBox="0 0 600 220" width="100%" height="100%" preserveAspectRatio="none">{nv.map((v, i) => <g key={i}><rect x={i * 20 + 4} y={200 - v * 2.5} width="12" height={v * 2.5} rx="2" fill="var(--brand-dk)" /><rect x={i * 20 + 4} y={202} width="12" height={(i % 3 + 1) * 4} rx="1" fill="var(--text)" /></g>)}</svg> },
    { id: 'farm', title: 'By farm', sub: 'Responses · 30 days', c: 1, r: 2, body: <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{[...byFarm].sort((a, b) => b[1] - a[1]).map(([n, v], i) => <div key={n}><div className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}><span>{t(n)}</span><b style={{ fontWeight: 500 }}>{v.toLocaleString('en-US')}</b></div><div style={{ height: 8, borderRadius: 4, background: 'var(--subtle)', marginTop: 6 }}><div style={{ width: (v / Math.max(1, ...byFarm.map(x => x[1]))) * 100 + '%', height: '100%', borderRadius: 4, background: i ? 'var(--brand)' : 'var(--brand-dk)' }} /></div></div>)}</div> },
    { id: 'drop', title: 'Where people stop', sub: 'Respondents reaching each field', range: '30 days', c: 2, r: 2, body: <Bars rows={fields.map(x => [x[0], x[3], x[3] + '%'])} max={100} fmt={() => ''} hi={fields.reduce((m, x, i) => x[3] < fields[m][3] ? i : m, 0)} /> },
    { id: 'pref', title: 'By farm', sub: 'Share of responses', range: '30 days', c: 2, r: 2, body: <Donut center={f[3]} sub="" segs={[[t('New York'), 35, 'var(--brand-dk)'], [t('Pennsylvania'), 30, 'var(--brand)'], [t('Colorado'), 22, 'var(--text)'], [t('Kansas'), 13, 'var(--subtle)']]} /> },
    { id: 'latest', title: 'Latest responses', sub: '', c: 4, r: 2, body: <Table cols={[...cols3.map(t), t('Farms'), t('Submitted')]} rows={rows.slice(0, 4).map(r => [...cols3.map(c => cell(r, c)), t(r.farm), WHEN(r.i)])} /> },
  ]
  return <><Heading title={t(name)} desc={`${t('Forms')} › ${t(name)} · ${t(f[1])} · ${t(f[2])} · ${t('Owner')}: ${f[4]}`} chip={`${t(f[5])} · ${fields.length} ${t('Fields').toLowerCase()}`}><button className="btn secondary" onClick={() => go('forms')}><Icon n="back" style={{ transform: document.documentElement.dir === 'rtl' ? 'scaleX(-1)' : '' }} />{t('Go back')}</button><button className="btn primary" data-soon><Icon n="pencil" />{t('Edit form')}</button></Heading>
    <div className="tabs" role="tablist">{['Overview', 'Responses', 'Fields', 'Settings'].map(x => <button key={x} role="tab" aria-selected={tab === x} className={`tab ${tab === x ? 'on' : ''}`} onClick={() => setTab(x)}>{t(x)}{x === 'Responses' && <span className="faint"> {f[3]}</span>}{x === 'Fields' && <span className="faint"> {fields.length}</span>}</button>)}</div>
    {draft && tab !== 'Fields' && tab !== 'Settings' ? <div className="card" style={{ alignItems: 'flex-start' }}><h2>{t('Draft')}</h2><div className="muted">This form isn’t live yet, so it has no responses. Publish it from Settings.</div><button className="btn primary sm" onClick={() => setTab('Settings')}>{t('Settings')}</button></div> : <>
    {tab === 'Overview' && <><Kpis items={[[t('Responses · 30 days'), f[3], '+12%'], [t('New respondents'), Math.round(total * .96).toLocaleString('en-US'), '96%'], [t('Completion rate'), Math.min(...fields.map(x => x[3])) + '%', '+2 pts'], [t('Average time to complete'), `${fields.length > 5 ? 2 : 1}m ${10 + fields.length * 6}s`, '−12s']]} /><Bento t={t} items={widgets} id={'form-' + formIdx} /></>}
    {tab === 'Responses' && <ResponsesTab t={t} rows={rows} cols3={cols3} cell={cell} fields={fields} />}
    {tab === 'Fields' && <div className="card table-card"><div className="tscroll"><table className="data"><thead><tr><th>#</th><th>{t('Name')}</th><th>Type</th><th>Required</th><th>{t('Completion rate')}</th></tr></thead><tbody>
      {fields.map((x, i) => <tr key={x[0]}><td className="faint">{i + 1}</td><td className="strong">{x[0]}</td><td>{x[1]}</td><td>{x[2] ? <span className="status s-inprogress">Required</span> : <span className="status s-todo">Optional</span>}</td>
        <td><div className="row" style={{ flexWrap: 'nowrap' }}><div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--subtle)', minWidth: 80 }}><div style={{ width: x[3] + '%', height: '100%', borderRadius: 4, background: x[3] < 60 ? 'var(--text3)' : 'var(--brand-dk)' }} /></div><span style={{ minWidth: 40 }}>{draft ? '—' : x[3] + '%'}</span></div></td></tr>)}</tbody></table></div></div>}
    {tab === 'Settings' && <FormSettings t={t} f={f} />}</>}
  </>
}
function ResponsesTab({ t, rows, cols3, cell, fields }) {
  const [q, setQ] = useState(''); const [farm, setFarm] = useState('all'); const [open, setOpen] = useState(null)
  const shown = rows.filter(r => (farm === 'all' || r.farm === farm) && (r.name + cols3.map(c => cell(r, c)).join(' ')).toLowerCase().includes(q.toLowerCase()))
  return <div className="card table-card">
    <div className="row" style={{ padding: '12px 0', justifyContent: 'space-between' }}>
      <div className="search" style={{ maxWidth: 360 }}><Icon n="search" size={18} /><input aria-label="Search responses" value={q} onChange={e => setQ(e.target.value)} placeholder="Search responses" style={{ border: 0, background: 'transparent', outline: 0, flex: 1, font: 'inherit', color: 'inherit' }} /></div>
      <div className="row"><Menu icon="pin" label={farm === 'all' ? t('All farms') : t(farm)} value={farm} onPick={setFarm} items={[{ value: 'all', label: t('All farms') }, '-', ...FARMS.map(x => ({ value: x, label: t(x) }))]} /><button className="btn secondary" data-soon><Icon n="download" />{t('Export')}</button></div>
    </div>
    <div className="tscroll"><table className="data"><thead><tr>{cols3.map(c => <th key={c}>{c}</th>)}<th>{t('Farms')}</th><th>{t('Submitted')}</th><th>{t('Status')}</th></tr></thead>
      <tbody>{shown.map(r => <React.Fragment key={r.i}><tr className="click" tabIndex={0} aria-expanded={open === r.i} onClick={() => setOpen(open === r.i ? null : r.i)} onKeyDown={e => e.key === 'Enter' && setOpen(open === r.i ? null : r.i)}>{cols3.map((c, j) => <td key={c} className={j ? '' : 'strong'}>{cell(r, c)}</td>)}<td>{t(r.farm)}</td><td>{WHEN(r.i)}</td><td><span className={`status ${r.i % 5 === 4 ? 's-todo' : 's-done'}`}>{r.i % 5 === 4 ? 'Partial' : t('Submitted')}</span></td></tr>
        {open === r.i && <tr><td colSpan={cols3.length + 3} style={{ background: 'var(--bg)' }}><dl className="facts" style={{ gridTemplateColumns: '180px 1fr' }}>{fields.map(x => <React.Fragment key={x[0]}><dt>{x[0]}</dt><dd>{String(cell(r, x[0]))}</dd></React.Fragment>)}</dl></td></tr>}</React.Fragment>)}
      </tbody></table></div>
    <div className="faint" style={{ padding: '8px 0' }}>{shown.length} of {rows.length} shown · sample data</div>
  </div>
}
function FormSettings({ t, f }) {
  const [live, setLive] = useState(f[5] === 'Live'); const [farms, setFarms] = useState(FARMS.map(() => true))
  const [dirty, setDirty] = useState(false); const dd = () => setDirty(true)
  const S = ({ l, d }) => <SetRow l={l} d={d} onDirty={dd} />
  return <div className="cards-2" onInput={dd}>
    <div className="card"><h2>{t('Settings')}</h2>
      <div className="field"><label>{t('Name')}</label><input defaultValue={t(f[0])} /></div>
      <div className="field"><label>{t('Audience')}</label><input defaultValue={t(f[1])} /></div>
      <div className="field"><label>{t('Owner')}</label><input defaultValue={f[4]} /></div>
      <div className="setting"><span className="txt">Accept responses ({live ? t('Live') : t('Draft')})</span><Switch on={live} onChange={v => { setLive(v); dd() }} label="Accept responses" /></div>
    </div>
    <div className="card"><h2>{t('Farms')}</h2>{FARMS.map((x, i) => <div className="setting" key={x}><span className="txt">{t(x)}</span><Switch on={farms[i]} onChange={v => { setFarms(a => a.map((y, j) => j === i ? v : y)); dd() }} label={x} /></div>)}
      <h2 style={{ marginTop: 8 }}>{t('Notifications')}</h2><S l="Notify the owner on every response" d={false} /><S l="Daily summary email" /><S l="Remind assignees when overdue" />
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>{dirty && <span className="faint">{t('Unsaved changes')}</span>}<button className="btn text" disabled={!dirty} onClick={() => setDirty(false)}>{t('Discard changes')}</button><button className="btn primary" disabled={!dirty} onClick={() => { setDirty(false); toast(t('Changes saved')) }}>{t('Save changes')}</button></div></div>
  </div>
}

// ---------------- TASKS ----------------
const BOARD = [['To do', '48', [['Tractor 3 · oil check', 'Field North · Pennsylvania', 'Rafael Moura', 'Tue 10'], ['Clean harvester blades', 'Field East · Pennsylvania', 'Rafael Moura', 'Wed 11'], ['Restock beet crates', 'Packing House · Pennsylvania', 'Clara Ribeiro', 'Thu 12']]], ['In progress', '71', [['Harvest Field North · rows 12–18', 'Field North · Pennsylvania', 'Rafael Moura', 'Today'], ['Load beets for Packing House', 'Field North · Pennsylvania', 'João Batista', 'Today'], ['Irrigation line repair', 'Field 2 · Colorado', 'Samir Haddad', 'Today']]], ['Done', '214', [['Fuel log · week 45', 'Pennsylvania', 'Rafael Moura', 'Fri 6'], ['Cold room temperature check', 'Packing House · New York', 'Omar Nasser', 'Fri 6']]]]
const TASKS0 = BOARD.flatMap(([st, , ts]) => ts.map(x => ({ task: x[0], loc: x[1], who: x[2], due: x[3], st })))
const STATUSES = ['To do', 'In progress', 'Done']
function TasksPage({ t, mgr, openTask, newTask, tasks }) {
  const [tab, setTab] = useState('All')
  const rows = tasks.filter(r => mgr || r.who === 'Rafael Moura')
  const shown = rows.filter(r => tab === 'All' || r.st === tab)
  const count = s => rows.filter(r => s === 'All' || r.st === s).length
  return <><Heading title={t(mgr ? 'Tasks' : 'My tasks')} desc={t('Work assigned to the field team across farms. Employees only see their own tasks.')} chip={mgr ? t('Manager · can switch to any farm or All farms') : t('Employee · Pennsylvania only')}>{mgr && <button className="btn primary" onClick={newTask}><Icon n="plus" />{t('New task')}</button>}</Heading>
    {mgr && <Kpis items={[[t('Open tasks'), '128', '+11', true], [t('Due today'), '23', '4 ' + t('farms'), true], [t('Overdue'), '9', '−4'], [t('Completed · this week'), '214', '+18%']]} />}
    <div className="card table-card">
      <div className="tabs" role="tablist">{['All', 'To do', 'In progress', 'Done'].map(s => <button key={s} role="tab" aria-selected={tab === s} className={`tab ${tab === s ? 'on' : ''}`} onClick={() => setTab(s)}>{t(s)} <span className="faint">{count(s)}</span></button>)}</div>
      <div className="tscroll"><table className="data"><colgroup><col style={{ width: '30%' }} /><col style={{ width: '22%' }} /><col style={{ width: '17%' }} /><col style={{ width: '11%' }} /><col style={{ width: '20%' }} /></colgroup><thead><tr><th>{t('Task')}</th><th>{t('Farm · site')}</th><th>{t('Assignee')}</th><th>{t('Due')}</th><th>{t('Status')}</th></tr></thead>
        <tbody>{shown.map(r => <tr key={r.task} className="click" tabIndex={0} onClick={() => openTask(r.task)} onKeyDown={e => e.key === 'Enter' && openTask(r.task)}>
          <td className="strong">{r.task}</td><td>{r.loc}</td><td>{r.who}</td><td style={r.due === 'Today' ? { fontWeight: 500 } : null}>{t(r.due)}</td>
          <td><span className={`status s-${r.st.replace(' ', '').toLowerCase()}`}>{t(r.st)}</span></td></tr>)}</tbody></table></div>
    </div></>
}
function TaskSheet({ t, task, close, onSave }) {
  const [checks, setChecks] = useState([true, true, false, false])
  const [st, setSt] = useState(task.st)
  useEffect(() => { const k = e => e.key === 'Escape' && close(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  return <><div className="scrim" onClick={close} /><aside className="sheet" role="dialog" aria-modal="true" aria-label={task.task}>
    <div className="shead"><h2>{task.task}</h2><button className="iconbtn" onClick={close} aria-label="Close"><Icon n="x" /></button></div>
    <div className="sbody">
      <div className="row"><span className={`status s-${st.replace(' ', '').toLowerCase()}`}>{t(st)}</span>
        <Menu kind="secondary sm" label={t('Status') + ': ' + t(st)} value={st} onPick={setSt} items={STATUSES.map(x => ({ value: x, label: t(x) }))} /></div>
      {st !== task.st && <div className="hint">{t('Status')}: {t(task.st)} → {t(st)}. {t('Save')}?</div>}
      <dl className="facts"><dt>{t('Assignee')}</dt><dd>{task.who}</dd><dt>{t('Farm · site')}</dt><dd>{task.loc}</dd><dt>{t('Due')}</dt><dd>{t(task.due)}</dd><dt>{t('Priority')}</dt><dd>{t('High')}</dd><dt>{t('Linked form')}</dt><dd>{t('Daily harvest log')}</dd><dt>{t('Created by')}</dt><dd>Aline Prado</dd></dl>
      <h2>{t('Checklist')} · {checks.filter(Boolean).length}/4</h2>
      {['Check equipment', 'Start the job', 'Finish the job', 'Log it in the linked form'].map((c, i) => <label key={c} className="row" style={{ gap: 10, fontSize: 14 }}><input type="checkbox" checked={checks[i]} onChange={() => setChecks(s => s.map((v, j) => j === i ? !v : v))} style={{ width: 18, height: 18, accentColor: 'var(--brand-dk)' }} />{c}</label>)}
      <h2>{t('Activity')}</h2><div><b className="display" style={{ fontWeight: 500, fontSize: 14 }}>{task.who}</b><div className="faint">{t(task.st)} · 07:42</div></div>
    </div>
    <div className="sfoot"><button className="btn primary" onClick={() => { onSave(st); close() }}>{t('Save')}</button><button className="btn secondary" onClick={close}>{t('Cancel')}</button></div>
  </aside></>
}
function NewTask({ t, close, onCreate }) {
  const [v, setV] = useState({ task: '', desc: '', who: 'Rafael Moura', loc: 'Field North · Pennsylvania', due: '2026-11-10T17:00', pr: 'High', form: 'Daily harvest log', rep: false })
  const [err, setErr] = useState(false)
  const set = k => e => setV(o => ({ ...o, [k]: e.target ? e.target.value : e }))
  useEffect(() => { const k = e => e.key === 'Escape' && close(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [])
  const submit = e => { e.preventDefault(); if (!v.task.trim()) { setErr(true); return }
    const d = new Date(v.due); const due = isNaN(d) ? v.due : d.toDateString() === new Date('2026-11-09').toDateString() ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.getDate()
    onCreate({ task: v.task.trim(), loc: v.loc, who: v.who, due, st: 'To do' }); close() }
  const Sel = ({ k, l, opts }) => <div className="field"><label htmlFor={'nt-' + k}>{t(l)}</label><select id={'nt-' + k} value={v[k]} onChange={set(k)}>{opts.map(o => <option key={o} value={o}>{t(o)}</option>)}</select></div>
  return <><div className="scrim" onClick={close} /><form className="dialog" role="dialog" aria-modal="true" aria-label={t('New task')} onSubmit={submit}>
    <h1>{t('New task')}</h1><p className="muted" style={{ margin: 0 }}>{t('Assign work to someone on a farm. They’ll see it in My tasks.')}</p>
    <div className="field"><label htmlFor="nt-task">{t('Task name')} *</label><input id="nt-task" autoFocus value={v.task} onChange={e => { set('task')(e); setErr(false) }} placeholder="Harvest Field North · rows 12–18" aria-invalid={err} aria-describedby={err ? 'nt-err' : undefined} />{err && <div className="err" id="nt-err" role="alert">{t('Enter a task name.')}</div>}</div>
    <div className="field"><label htmlFor="nt-desc">{t('Description')}</label><textarea id="nt-desc" value={v.desc} onChange={set('desc')} /></div>
    <div className="row" style={{ flexWrap: 'nowrap' }}><Sel k="who" l="Assign to" opts={['Rafael Moura', 'João Batista', 'Clara Ribeiro', 'Beatriz Lima', 'Samir Haddad', 'Omar Nasser']} /><Sel k="loc" l="Farm · site" opts={['Field North · Pennsylvania', 'Field East · Pennsylvania', 'Packing House · Pennsylvania', 'Field 2 · Colorado', 'Packing House · New York', 'Field 1 · Kansas']} /></div>
    <div className="row" style={{ flexWrap: 'nowrap' }}><div className="field"><label htmlFor="nt-due">{t('Due date')}</label><input id="nt-due" type="datetime-local" value={v.due} onChange={set('due')} /></div><Sel k="pr" l="Priority" opts={['Low', 'Medium', 'High']} /></div>
    <Sel k="form" l="Linked form (optional)" opts={['—', 'Daily harvest log', 'Machinery check', 'Safety training']} />
    <div className="row"><Switch on={v.rep} onChange={x => setV(o => ({ ...o, rep: x }))} label={t('Repeat this task weekly')} />{t('Repeat this task weekly')}</div>
    <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn text" onClick={close}>{t('Cancel')}</button><button type="submit" className="btn primary">{t('Create task')}</button></div>
  </form></>
}

// ---------------- SETTINGS ----------------
function AccountsPage({ t }) {
  const [q, setQ] = useState('')
  const people = [['Aline Prado', 'Manager', 'All farms', 'Today'], ['Samir Haddad', 'Manager', 'All farms', 'Today'], ['Lúcia Ferraz', 'Manager', 'All farms', 'Yesterday'], ['Omar Nasser', 'Manager', 'All farms', 'Nov 6'], ['Rafael Moura', 'Employee', 'Pennsylvania', 'Today'], ['João Batista', 'Employee', 'Pennsylvania', 'Today'], ['Clara Ribeiro', 'Employee', 'Kansas', 'Yesterday'], ['Beatriz Lima', 'Employee', 'Pennsylvania', 'Nov 5']]
  const shown = people.filter(p => p[0].toLowerCase().includes(q.toLowerCase()))
  return <><Heading title={t('Accounts')} desc={t('People with access to Schrute Farms, their role and farm.')}><button className="btn primary" data-soon><Icon n="plus" />{t('Invite member')}</button></Heading>
    <div className="card table-card"><div className="row" style={{ padding: '12px 0' }}><label className="search" style={{ maxWidth: 360 }}><Icon n="search" size={18} /><input aria-label={t('Search people')} placeholder={t('Search people')} value={q} onChange={e => setQ(e.target.value)} /></label></div>
      <div className="tscroll"><table className="data"><colgroup><col style={{ width: '32%' }} /><col style={{ width: '18%' }} /><col style={{ width: '22%' }} /><col style={{ width: '16%' }} /><col style={{ width: '12%' }} /></colgroup>
        <thead><tr><th>{t('Name')}</th><th>{t('Role')}</th><th>{t('Farms')}</th><th>Last active</th><th></th></tr></thead>
        <tbody>{shown.map(p => <tr key={p[0]}><td className="strong">{p[0]}</td><td><span className={`status ${p[1] === 'Manager' ? 's-inprogress' : 's-todo'}`}>{t(p[1])}</span></td><td>{t(p[2])}</td><td>{t(p[3])}</td>
          <td style={{ overflow: 'visible' }}><Menu end kind="text sm" label={t('Edit')} trailing="chev" value="" onPick={v => toast(t(v === 'role' ? 'Not in the prototype yet' : 'Not in the prototype yet'))} items={[{ value: 'role', label: t('Change role') }, { value: 'rm', label: t('Remove') }]} /></td></tr>)}</tbody></table></div></div></>
}
function RolesPage({ t, tab }) {
  const perms = [['Dashboard', 'View all farms and “All farms”', 0], ['', 'View own farm overview', 1, 'Own farm, limited'], ['', 'Customize layout and export', 0], ['Forms', 'Create and edit forms', 0], ['', 'Fill in forms', 1, 'Own forms only'], ['', 'See all responses', 1, 'Own responses only'], ['Tasks', 'Assign tasks', 0], ['', 'Complete tasks', 1, 'Own tasks only'], ['Accounts', 'Invite members and change roles', 0], ['', 'Edit own account', 1], ['Workspace settings', 'Farms, app settings, templates, notifications', 0]]
  const [emp, setEmp] = useState(perms.map(p => !!p[2]))
  return <><Heading title={t(tab ? 'Accounts' : 'Roles & permissions')} desc={t('Decide what each role can see and do across Schrute Farms.')}><button className="btn primary" data-soon><Icon n="plus" />{t('Invite member')}</button></Heading>
    {!tab && <div className="card"><h2>{t('Permissions')}</h2><div className="muted">{t('Turn permissions on or off for the Employee role. Manager permissions are fixed.')}</div>
      <table><thead><tr><th>{t('Area')}</th><th>{t('Permission')}</th><th>{t('Manager')}</th><th>{t('Employee')}</th></tr></thead><tbody>
        {perms.map((p, i) => <tr key={i}><td>{t(p[0])}</td><td>{p[1]}</td><td><Switch on disabled label="Manager" /></td><td><div className="row"><Switch on={emp[i]} onChange={v => setEmp(e => e.map((x, j) => j === i ? v : x))} label={p[1]} />{emp[i] && p[3] && <span className="faint">{p[3]}</span>}</div></td></tr>)}
      </tbody></table></div>}
    <div className="card"><h2>{t('Members')}</h2><Table cols={[t('Name'), t('Manager') + ' / ' + t('Employee'), t('Farms')]} rows={[['Aline Prado', t('Manager'), t('All farms')], ['Samir Haddad', t('Manager'), t('All farms')], ['Lúcia Ferraz', t('Manager'), t('All farms')], ['Rafael Moura', t('Employee'), t('Pennsylvania')], ['Clara Ribeiro', t('Employee'), t('Kansas')]]} /></div></>
}
function FarmsPage({ t }) {
  const fs = [['Pennsylvania', 'Wayne County', 'Aline Prado', 412, 4, 14], ['Colorado', 'Weld County', 'Samir Haddad', 296, 3, 9], ['New York', 'Orange County', 'Lúcia Ferraz', 338, 3, 17], ['Kansas', 'Finney County', 'Omar Nasser', 214, 2, 8]]
  return <><Heading title={t('Farms & locations')} desc={t('The farms that sell through the Schrute Farms app, and the fields and sites inside each one.')}><button className="btn primary" data-soon><Icon n="plus" />{t('Add farm')}</button></Heading>
    <div className="cards-2">{fs.map(f => <article className="card entity" key={f[0]}>
      <header><span className="avatar"><img src="/logo.svg" alt="" width="28" height="28" className="logo" /></span><div className="titles"><h2>{farmTitle(t, f[0])}</h2><div className="muted loc"><Icon n="pin" size={14} />{f[1]}, {t(f[0])}</div></div><span className="chip">{t('Live in app')}</span></header>
      <dl className="stats">{[[t('Manager'), f[2]], [t('Members'), f[3]], ['Sites', f[4]], [t('Product'), f[5]]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <footer><button className="btn secondary sm" data-soon>{t('Edit farm')}</button><button className="btn text sm" data-soon>{t('Manage sites')} ›</button></footer>
    </article>)}</div></>
}
function TemplatesPage({ t }) {
  const tp = [['Daily harvest log', 'Employees', 9, 'Rows harvested, tonnes, crate count, issues.'], ['Machinery check', 'Employees', 12, 'Pre-use checklist for tractors, harvesters and loaders.'], ['Safety training', 'Employees', 7, 'Training completed, signature, expiry date.'], ['App client sign-up', 'App clients', 6, 'Name, email, delivery area, preferred farm.'], ['Buyer company registration', 'App clients', 11, 'Company, tax ID, products wanted, monthly volume.'], ['Product return reason', 'App clients', 5, 'Order, product, reason, photo, refund or replace.']]
  return <><Heading title={t('Form templates')} desc={t('Reusable starting points for new forms.')}><button className="btn primary" data-soon><Icon n="plus" />{t('New template')}</button></Heading>
    <div className="cards-3">{tp.map(([n, aud, f, d]) => <article className="card entity" key={n}>
      <header><span className="avatar"><Icon n="template" size={20} /></span><div className="titles"><h2>{t(n)}</h2><div className="faint">{t(aud)} · {f} {t('Fields').toLowerCase()}</div></div></header>
      <p className="muted desc">{d}</p>
      <footer><button className="btn secondary sm" data-soon>{t('Use template')}</button><button className="btn text sm" data-soon>{t('Edit')}</button></footer>
    </article>)}</div></>
}
function AppSettings({ t }) {
  const [dirty, setDirty] = useState(false); const [ver, setVer] = useState(0); const d = () => setDirty(true)
  return <><Heading title={t('App settings')} desc={t('How the Schrute Farms app looks and sells for app clients.')} />
    <div className="cards-2" key={ver} onInput={d}>
      <div className="card"><h2>Store</h2><div className="field"><label htmlFor="as-name">Store name</label><input id="as-name" defaultValue={t('Schrute Farms')} /></div><div className="field"><label htmlFor="as-cur">Currency</label><input id="as-cur" defaultValue="US dollar (USD)" /></div><SetRow onDirty={d} l="Show the farm on each product" /><SetRow onDirty={d} l="Let clients pick a preferred farm" /></div>
      <div className="card"><h2>Delivery</h2><div className="field"><label htmlFor="as-min">Minimum order</label><input id="as-min" defaultValue="$25.00" /></div><SetRow onDirty={d} l="Same-day delivery" /><SetRow onDirty={d} l="Pickup at the farm" /><SetRow onDirty={d} l="Weekly subscription boxes" d={false} /></div>
      <div className="card"><h2>{t('Returns')}</h2><div className="field"><label htmlFor="as-ret">Return window</label><input id="as-ret" defaultValue="7 days after delivery" /></div><SetRow onDirty={d} l="Ask for a photo with every return" /><SetRow onDirty={d} l="Refund automatically under $10" d={false} /></div>
      <div className="card"><h2>{t('Payments')}</h2><SetRow onDirty={d} l="Card" /><SetRow onDirty={d} l="Apple Pay and Google Pay" /><SetRow onDirty={d} l="Pay on delivery" d={false} /></div>
    </div>
    <div className="savebar">{dirty && <span className="faint">{t('Unsaved changes')}</span>}<button className="btn text" disabled={!dirty} onClick={() => { setDirty(false); setVer(x => x + 1) }}>{t('Discard changes')}</button><button className="btn primary" disabled={!dirty} onClick={() => { setDirty(false); toast(t('Changes saved')) }}>{t('Save changes')}</button></div></>
}
function NotifPage({ t }) {
  const ev = [['New order over $500', 'Farm manager', 1, 1, 1], ['Return requested', 'Farm manager', 1, 0, 1], ['Task overdue', 'Assignee and manager', 0, 1, 1], ['Form submission overdue', 'Assignee', 0, 1, 1], ['Weekly app growth digest', 'All managers', 1, 0, 0]]
  const [s, setS] = useState(ev.map(e => e.slice(2)))
  return <><Heading title={t('Notifications')} desc={t('Choose who gets told about what, and how.')} />
    <div className="card"><table><thead><tr><th>{t('Event')}</th><th>{t('Sent to')}</th><th>{t('Email')}</th><th>{t('Push')}</th><th>{t('In-app')}</th></tr></thead><tbody>
      {ev.map((e, i) => <tr key={i}><td>{e[0]}</td><td>{e[1]}</td>{[0, 1, 2].map(j => <td key={j}><Switch on={!!s[i][j]} onChange={v => setS(x => x.map((r, a) => a === i ? r.map((c, b) => b === j ? v : c) : r))} label={`${e[0]} · ${[t('Email'), t('Push'), t('In-app')][j]}`} /></td>)}</tr>)}
    </tbody></table></div></>
}
