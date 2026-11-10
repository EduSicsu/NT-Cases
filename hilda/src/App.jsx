import { Component, useEffect, useState } from 'react'
import { AppProvider, useApp } from './store.jsx'
import { go, match, useLocation } from './router.js'
import { Icon, ToastProvider } from './ui.jsx'
import { Forgot, Login, Role, Signup, homeFor } from './screens/auth.jsx'
import { ClientDelivery, ClientHome, ClientItem, ClientList, ClientOrder, ClientOrders, ClientSent } from './screens/client.jsx'
import { ProducerOrder, ProducerOrders, ProducerProducts } from './screens/producer.jsx'
import { NotFound, Profile } from './screens/common.jsx'

const ROUTES = [
  { p: '/login', C: Login, title: 'btnLogin' },
  { p: '/signup', C: Signup, title: 'signupTitle' },
  { p: '/forgot', C: Forgot, title: 'forgotTitle' },
  { p: '/role', C: Role, title: 'roleTitle', auth: true },
  { p: '/profile', C: Profile, title: 'profileTitle', auth: true, anyRole: true },
  { p: '/client/home', C: ClientHome, title: 'navHome', auth: true, role: 'client' },
  { p: '/client/item/:id', C: ClientItem, title: 'navHome', auth: true, role: 'client' },
  { p: '/client/list', C: ClientList, title: 'listTitle', auth: true, role: 'client' },
  { p: '/client/delivery', C: ClientDelivery, title: 'delTitle', auth: true, role: 'client' },
  { p: '/client/sent/:id', C: ClientSent, title: 'sentTitle', auth: true, role: 'client' },
  { p: '/client/orders', C: ClientOrders, title: 'ordersTitle', auth: true, role: 'client' },
  { p: '/client/orders/:id', C: ClientOrder, title: 'orderDetail', auth: true, role: 'client' },
  { p: '/producer/orders', C: ProducerOrders, title: 'pOrdersTitle', auth: true, role: 'producer' },
  { p: '/producer/orders/:id', C: ProducerOrder, title: 'orderDetail', auth: true, role: 'producer' },
  { p: '/producer/products', C: ProducerProducts, title: 'pProdTitle', auth: true, role: 'producer' },
]
const AUTH_ONLY_PUBLIC = ['/login', '/signup', '/forgot']

function resolve(path, user) {
  if (path === '/') return { redirect: user ? (user.role ? homeFor(user.role) : '/role') : '/login' }
  let route = null
  let params = null
  for (const r of ROUTES) { params = match(r.p, path); if (params) { route = r; break } }
  if (!route) return { notFound: true }
  if (route.auth && !user) return { redirect: `/login?next=${encodeURIComponent(path)}` }
  if (!route.auth && user && AUTH_ONLY_PUBLIC.includes(path)) return { redirect: user.role ? homeFor(user.role) : '/role' }
  if (route.auth && user && !user.role && route.p !== '/role') return { redirect: '/role' }
  if (route.role && user?.role && route.role !== user.role) return { redirect: homeFor(user.role) }
  return { route, params }
}

class Boundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error(error) }
  render() {
    return this.state.error ? this.props.fallback(() => this.setState({ error: null })) : this.props.children
  }
}

function Crash({ reset }) {
  const { t } = useApp()
  return (
    <div className="screen">
      <div className="scroll">
        <div className="sheet crash">
          <div className="empty">
            <div className="empty-ic"><Icon name="alert" size={32} /></div>
            <h2>{t('genericError')}</h2>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => { reset(); go('/', { replace: true }) }}><span>{t('goHome')}</span></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function useOnline() {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const a = () => setOn(true)
    const b = () => setOn(false)
    window.addEventListener('online', a)
    window.addEventListener('offline', b)
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b) }
  }, [])
  return on
}

function Shell() {
  const { state, t } = useApp()
  const { path, query } = useLocation()
  const online = useOnline()
  const view = resolve(path, state.user)

  // language and direction on <html>
  useEffect(() => {
    document.documentElement.lang = t.lang === 'pt' ? 'pt-BR' : t.lang
    document.documentElement.dir = t.dir
  }, [t.lang, t.dir])

  // theme: light, dark or follow the system
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = state.theme === 'dark' || (state.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1F3A2E' : '#BFF0E1')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [state.theme])

  // redirects
  useEffect(() => { if (view.redirect) go(view.redirect, { replace: true }) }, [view.redirect])

  // tab title
  useEffect(() => {
    const k = view.route?.title || 'notFoundTitle'
    document.title = `${t(k)} · ${t('appName')}`
  }, [view.route, t])

  if (view.redirect) return null
  const C = view.notFound ? NotFound : view.route.C

  return (
    <div className="stage">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>{t('skip')}</a>
      <div className="app">
        {!online && <div className="offline" role="status"><Icon name="wifiOff" size={16} /> {t('offline')}</div>}
        <Boundary key={path} fallback={(reset) => <Crash reset={reset} />}>
          <C key={path} params={view.params || {}} query={query} />
        </Boundary>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AppProvider>
  )
}
