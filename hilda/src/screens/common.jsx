import { useState } from 'react'
import { useApp } from '../store.jsx'
import { go } from '../router.js'
import { Button, EmptyState, Icon, LangPills, Screen, Sheet, ThemePills, useToast } from '../ui.jsx'
import { homeFor } from './auth.jsx'

export function Profile() {
  const { t, state, setRole, logout, reset } = useApp()
  const toast = useToast()
  const [dlg, setDlg] = useState(null) // 'logout' | 'reset'
  const user = state.user
  const role = user.role
  const other = role === 'client' ? 'producer' : 'client'
  const roleName = (r) => t(r === 'client' ? 'roleClient' : 'roleProducer')

  const switchRole = () => {
    setRole(other)
    toast(t('roleSwitched', { role: roleName(other) }))
    go(homeFor(other), { replace: true })
  }
  const doLogout = () => { setDlg(null); logout(); go('/login', { replace: true }) }
  const doReset = () => { reset(); setDlg(null); toast(t('resetDone')) }

  return (
    <Screen title={t('profileTitle')} nav={{ kind: role, active: 'profile' }}>
      <div className="user-card">
        <span className="avatar big" aria-hidden="true">{(user.name || '?').charAt(0).toUpperCase()}</span>
        <div>
          <strong>{user.name}</strong>
          <p className="muted-text">{user.contact === 'demo' ? '—' : user.contact}</p>
        </div>
      </div>

      <section className="setting" aria-labelledby="s-role">
        <h2 id="s-role" className="h2">{t('roleLabel')}</h2>
        <p className="body-text">{roleName(role)}</p>
        <Button kind="secondary" size="sm" icon={other === 'producer' ? 'leaf' : 'basket'} onClick={switchRole}>{t('switchRole', { role: roleName(other) })}</Button>
      </section>
      <section className="setting" aria-labelledby="s-lang">
        <h2 id="s-lang" className="h2">{t('langLabel')}</h2>
        <LangPills />
      </section>
      <section className="setting" aria-labelledby="s-theme">
        <h2 id="s-theme" className="h2">{t('themeLabel')}</h2>
        <ThemePills />
      </section>

      <div className="stack">
        <Button kind="outline" icon="logout" onClick={() => setDlg('logout')}>{t('logout')}</Button>
        <Button kind="ghost" size="sm" icon="refresh" onClick={() => setDlg('reset')}>{t('resetDemo')}</Button>
      </div>

      <Sheet
        open={dlg === 'logout'} onClose={() => setDlg(null)} title={t('logoutTitle')}
        footer={<><Button kind="outline" onClick={() => setDlg(null)}>{t('cancel')}</Button><Button onClick={doLogout}>{t('logout')}</Button></>}
      >
        <p className="body-text">{t('logoutText')}</p>
      </Sheet>
      <Sheet
        open={dlg === 'reset'} onClose={() => setDlg(null)} title={t('resetTitle')}
        footer={<><Button kind="outline" onClick={() => setDlg(null)}>{t('cancel')}</Button><Button kind="danger" onClick={doReset}>{t('resetDemo')}</Button></>}
      >
        <p className="body-text">{t('resetText')}</p>
      </Sheet>
    </Screen>
  )
}

export function NotFound() {
  const { t, state } = useApp()
  const home = state.user ? (state.user.role ? homeFor(state.user.role) : '/role') : '/login'
  return (
    <Screen title={t('notFoundTitle')}>
      <EmptyState icon="alert" title={t('notFoundTitle')} text={t('notFoundText')} action={<Button onClick={() => go(home, { replace: true })}>{t('goHome')}</Button>} />
    </Screen>
  )
}
