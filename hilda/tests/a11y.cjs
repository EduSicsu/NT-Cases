const { chromium } = require('playwright')
const fs = require('fs')
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const BASE = 'http://127.0.0.1:4173'
const ROUTES = {
  client: ['/#/client/home', '/#/client/item/tomato', '/#/client/item/jambu', '/#/client/list', '/#/client/delivery', '/#/client/orders', '/#/profile'],
  producer: ['/#/producer/orders', '/#/producer/orders/o128', '/#/producer/orders/o125', '/#/producer/products'],
  public: ['/#/login', '/#/signup', '/#/forgot', '/#/role'],
}
;(async () => {
  const browser = await chromium.launch()
  const seen = new Map()
  for (const [lang, theme] of [['pt', 'light'], ['pt', 'dark'], ['ar', 'light'], ['en', 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: lang === 'ar' ? 'ar' : 'pt-BR' })
    const page = await ctx.newPage(); page.setDefaultTimeout(8000)
    await page.addInitScript(([l, t]) => { if (!localStorage.getItem('hilda:v1')) localStorage.setItem('hilda:seed', '1') ; window.__L = [l, t] }, [lang, theme])
    await page.goto(BASE + '/#/login'); await page.waitForSelector('h1')
    // choose language + theme through the UI-persisted state
    await page.evaluate(([l, t]) => { const s = JSON.parse(localStorage.getItem('hilda:v1') || '{}'); }, [lang, theme])
    const run = async (url, role) => {
      await page.goto(BASE + url); await page.waitForTimeout(650)
      await page.addScriptTag({ content: axeSrc })
      const r = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(' '), msg: v.nodes[0].failureSummary.split('\n').slice(0, 2).join(' | ') })))
      for (const v of r) { const k = v.id + '|' + url; const cur = seen.get(k) || { ...v, ctx: [] }; cur.ctx.push(`${lang}/${theme}`); seen.set(k, cur) }
    }
    // set language/theme by clicking real controls on login
    await page.goto(BASE + '/#/login'); await page.waitForSelector('h1')
    await page.getByRole('radio', { name: lang.toUpperCase() }).click()
    if (theme === 'dark') await page.locator('.quick-theme').click()
    for (const u of ROUTES.public.slice(0, 3)) await run(u)
    // client session
    await page.goto(BASE + '/#/login')
    await page.getByRole('button', { name: /cliente|customer|عميل/i }).first().click()
    await page.waitForTimeout(500)
    for (const u of ROUTES.client) await run(u)
    // producer session
    await page.goto(BASE + '/#/profile'); await page.waitForTimeout(400)
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hilda:v1')); s.user.role = 'producer'; s.lastRole = 'producer'; localStorage.setItem('hilda:v1', JSON.stringify(s)) })
    await page.reload(); await page.waitForTimeout(400)
    for (const u of ROUTES.producer) await run(u)
    await ctx.close()
  }
  const out = [...seen.values()].sort((a, b) => (a.impact > b.impact ? 1 : -1))
  console.log(out.length ? out.map((v) => `${v.impact} ${v.id} x${v.n} [${v.ctx.join(',')}] ${v.sample}\n   ${v.msg}`).join('\n') : 'NO AXE VIOLATIONS')
  await browser.close()
})()
