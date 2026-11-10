import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store.jsx'
import { go } from '../router.js'
import { Button, Field, Icon, PasswordField, QuickSettings, Screen, Sheet, useToast } from '../ui.jsx'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export function validId(v) {
  const s = v.trim()
  if (EMAIL.test(s)) return true
  const digits = s.replace(/[\s()+-]/g, '')
  return /^\d{10,13}$/.test(digits)
}

const focusFirstInvalid = () =>
  requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())

const nameFrom = (id) => {
  const s = id.trim()
  if (s.includes('@')) {
    const n = s.split('@')[0].replace(/[._-]+/g, ' ').trim()
    return n ? n.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Cliente'
  }
  return 'Cliente'
}

export const homeFor = (role) => (role === 'producer' ? '/producer/orders' : '/client/home')

function LegalLinks() {
  const { t } = useApp()
  const [open, setOpen] = useState(null)
  return (
    <>
      <div className="legal">
        <button type="button" className="link-btn muted" onClick={() => setOpen('terms')}>{t('terms')}</button>
        <button type="button" className="link-btn muted" onClick={() => setOpen('privacy')}>{t('privacy')}</button>
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open === 'terms' ? t('terms') : t('privacy')}>
        <p className="body-text">{open === 'terms' ? t('termsBody') : t('privacyBody')}</p>
      </Sheet>
    </>
  )
}

function Arch() {
  return (
    <div className="arch" aria-hidden="true">
      <Icon name="leaf" size={64} />
    </div>
  )
}

export function Login({ query }) {
  const { t, login, state } = useApp()
  const toast = useToast()
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])

  const validate = () => {
    const e = {}
    if (!id.trim()) e.id = t('errIdRequired')
    else if (!validId(id)) e.id = t('errIdInvalid')
    if (!pass) e.pass = t('errPassRequired')
    else if (pass.length < 6) e.pass = t('errPassShort')
    return e
  }
  const finish = (user) => {
    login({ ...user, role: user.role ?? state.lastRole ?? undefined })
    const next = query.next && query.next.startsWith('/') ? query.next : '/'
    go(next, { replace: true })
    toast(t('welcomeBack', { name: user.name }))
  }
  const submit = (e) => {
    e.preventDefault()
    if (loading) return
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) { focusFirstInvalid(); return }
    setLoading(true)
    setTimeout(() => {
      if (!alive.current) return
      setLoading(false)
      finish({ name: nameFrom(id), contact: id.trim() })
    }, 700)
  }
  const demo = (role) => finish({ name: role === 'producer' ? 'Dona Hilda' : 'Maria', contact: 'demo', role })

  return (
    <Screen band={<Arch />} topRight={<QuickSettings />}>
      <h1 className="h1" tabIndex={-1}>{t('loginTitle')}</h1>
      <p className="lede">{t('loginSub')}</p>
      <form className="form" onSubmit={submit} noValidate>
        <Field
          label={t('fId')} placeholder={t('fIdPh')} value={id} error={errors.id} autoComplete="username"
          inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next"
          onChange={(e) => { setId(e.target.value); if (errors.id) setErrors({ ...errors, id: undefined }) }}
        />
        <PasswordField
          label={t('fPass')} placeholder={t('fPassPh')} value={pass} error={errors.pass} t={t}
          show={show} onToggle={() => setShow(!show)} autoComplete="current-password" enterKeyHint="go"
          onChange={(e) => { setPass(e.target.value); if (errors.pass) setErrors({ ...errors, pass: undefined }) }}
        />
        <a className="link" href="#/forgot" onClick={(e) => { e.preventDefault(); go('/forgot') }}>{t('forgot')}</a>
        <Button type="submit" loading={loading}>{loading ? t('btnLoggingIn') : t('btnLogin')}</Button>
        <Button kind="secondary" onClick={() => go('/signup')}>{t('btnCreate')}</Button>
      </form>
      <div className="demo">
        <p>{t('demoTitle')}</p>
        <div className="demo-row">
          <Button kind="ghost" size="sm" icon="basket" onClick={() => demo('client')}>{t('demoClient')}</Button>
          <Button kind="ghost" size="sm" icon="leaf" onClick={() => demo('producer')}>{t('demoProducer')}</Button>
        </div>
      </div>
      <LegalLinks />
    </Screen>
  )
}

export function Signup() {
  const { t, login } = useApp()
  const toast = useToast()
  const [v, setV] = useState({ name: '', id: '', pass: '' })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])
  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }) }

  const submit = (e) => {
    e.preventDefault()
    if (loading) return
    const er = {}
    if (!v.name.trim()) er.name = t('errName')
    if (!v.id.trim()) er.id = t('errIdRequired')
    else if (!validId(v.id)) er.id = t('errIdInvalid')
    if (!v.pass) er.pass = t('errPassRequired')
    else if (v.pass.length < 6) er.pass = t('errPassShort')
    setErrors(er)
    if (Object.keys(er).length) { focusFirstInvalid(); return }
    setLoading(true)
    setTimeout(() => {
      if (!alive.current) return
      login({ name: v.name.trim(), contact: v.id.trim() })
      toast(t('accountCreated', { name: v.name.trim() }))
      go('/role', { replace: true })
    }, 700)
  }
  return (
    <Screen title={t('signupTitle')} sub={t('signupSub')} backTo="/login">
      <form className="form" onSubmit={submit} noValidate>
        <Field label={t('fName')} placeholder={t('fNamePh')} value={v.name} error={errors.name} autoComplete="name" enterKeyHint="next" onChange={set('name')} />
        <Field
          label={t('fId')} placeholder={t('fIdPh')} value={v.id} error={errors.id} autoComplete="username" inputMode="email"
          autoCapitalize="none" spellCheck={false} enterKeyHint="next" onChange={set('id')}
        />
        <PasswordField
          label={t('fPass')} placeholder={t('fPassPh')} hint={t('passHint')} value={v.pass} error={errors.pass} t={t}
          show={show} onToggle={() => setShow(!show)} autoComplete="new-password" enterKeyHint="go" onChange={set('pass')}
        />
        <Button type="submit" loading={loading}>{t('btnCreate')}</Button>
        <Button kind="ghost" onClick={() => go('/login', { replace: true })}>{t('haveAccount')}</Button>
      </form>
      <LegalLinks />
    </Screen>
  )
}

export function Forgot() {
  const { t } = useApp()
  const [id, setId] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    const er = !id.trim() ? t('errIdRequired') : !validId(id) ? t('errIdInvalid') : ''
    setError(er)
    if (er) { focusFirstInvalid(); return }
    setSent(true)
  }
  return (
    <Screen title={t('forgotTitle')} sub={t('forgotSub')} backTo="/login">
      {sent ? (
        <div className="done-card" role="status">
          <div className="empty-ic ok"><Icon name="check" size={32} /></div>
          <h2>{t('codeSentTitle')}</h2>
          <p>{t('codeSentText', { id: id.trim() })}</p>
          <Button onClick={() => go('/login', { replace: true })}>{t('backToLogin')}</Button>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <Field
            label={t('fId')} placeholder={t('fIdPh')} value={id} error={error} autoComplete="username" inputMode="email"
            autoCapitalize="none" spellCheck={false} enterKeyHint="send"
            onChange={(e) => { setId(e.target.value); setError('') }}
          />
          <Button type="submit">{t('sendCode')}</Button>
        </form>
      )}
    </Screen>
  )
}

export function Role() {
  const { t, state, setRole } = useApp()
  const [role, setLocal] = useState(state.user?.role || state.lastRole || 'client')
  const opts = [
    { id: 'client', icon: 'basket', title: t('roleCust'), text: t('roleCustD') },
    { id: 'producer', icon: 'leaf', title: t('roleProd'), text: t('roleProdD') },
  ]
  const go2 = () => { setRole(role); go(homeFor(role), { replace: true }) }
  return (
    <Screen
      title={t('roleTitle')} backTo="/login" topRight={<QuickSettings />}
      footer={<Button onClick={go2}>{t('continue')}</Button>}
    >
      <div className="cards" role="radiogroup" aria-label={t('roleTitle')}>
        {opts.map((o) => (
          <button
            key={o.id} type="button" role="radio" aria-checked={role === o.id}
            className={`opt ${role === o.id ? 'is-on' : ''}`} onClick={() => setLocal(o.id)}
          >
            <span className="opt-ic"><Icon name={o.icon} size={28} /></span>
            <span className="opt-text"><strong>{o.title}</strong><span>{o.text}</span></span>
            <span className="radio" aria-hidden="true">{role === o.id && <Icon name="check" size={14} />}</span>
          </button>
        ))}
      </div>
      <p className="note">{t('roleNote')}</p>
    </Screen>
  )
}
