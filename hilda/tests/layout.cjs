const { chromium } = require('playwright')
require('fs').mkdirSync(process.env.SHOTS || '/tmp/hilda-shots', { recursive: true })
const BASE = 'http://127.0.0.1:4173'
const VPS = [[320, 568], [360, 740], [390, 844], [430, 932], [844, 390], [768, 1024], [1280, 800]]
const ROUTES = ['/#/login', '/#/client/home', '/#/client/item/tomato', '/#/client/list', '/#/client/delivery', '/#/client/orders', '/#/profile', '/#/producer/orders', '/#/producer/orders/o128', '/#/producer/products']
;(async () => {
  const browser = await chromium.launch()
  const issues = new Map()
  for (const [w, h] of VPS) {
    for (const lang of ['pt', 'ar']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, locale: lang === 'ar' ? 'ar' : 'pt-BR' })
      const page = await ctx.newPage(); page.setDefaultTimeout(8000)
      await page.goto(BASE + '/#/login'); await page.waitForSelector('h1')
      if (lang === 'ar') await page.getByRole('radio', { name: 'AR' }).click()
      // seed: client with an item in the cart
      await page.getByRole('button', { name: /cliente|customer|عميل/ }).first().click(); await page.waitForTimeout(500)
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hilda:v1')); s.cart = [{ pid: 'tomato', size: 'M', qty: 2 }, { pid: 'cassava', size: 'L', qty: 1 }]; localStorage.setItem('hilda:v1', JSON.stringify(s)) })
      await page.reload(); await page.waitForTimeout(400)
      for (const r of ROUTES) {
        if (r.includes('producer')) {
          await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hilda:v1')); s.user.role = 'producer'; localStorage.setItem('hilda:v1', JSON.stringify(s)) })
        } else {
          await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hilda:v1')); if (s.user) s.user.role = 'client'; localStorage.setItem('hilda:v1', JSON.stringify(s)) })
        }
        await page.goto(BASE + r); await page.reload(); await page.waitForTimeout(550)
        const res = await page.evaluate(() => {
          const out = []
          const de = document.documentElement
          if (de.scrollWidth > de.clientWidth + 1) out.push(`h-scroll page ${de.scrollWidth}>${de.clientWidth}`)
          const app = document.querySelector('.app')?.getBoundingClientRect()
          const sc = document.querySelector('.scroll')
          if (sc && sc.scrollWidth > sc.clientWidth + 1) out.push(`h-scroll in .scroll ${sc.scrollWidth}>${sc.clientWidth}`)
          const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"]') }
          for (const el of document.querySelectorAll('button, a[href], input:not([type=checkbox]), select, [role=radio], [role=tab], [role=switch]')) {
            if (!vis(el)) continue
            const r = el.getBoundingClientRect()
            // inline text links inside a paragraph are exempt
            if (el.tagName === 'A' && (el.closest('p') || el.classList.contains('skip'))) continue
            if (r.width < 44 - 0.5 || r.height < 44 - 0.5) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 28)}"`)
            if (app && (r.right > app.right + 1 || r.left < app.left - 1)) out.push(`outside app ${el.tagName} "${(el.textContent || '').trim().slice(0, 20)}"`)
          }
          // clipped text: element whose content is wider than its box and clips
          for (const el of document.querySelectorAll('h1, h2, strong, .chip, .tab, .btn span, .pcard-name, .tab-label')) {
            if (!vis(el)) continue
            if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push(`clipped text "${el.textContent.trim().slice(0, 24)}"`)
          }
          return out
        })
        for (const m of res) { const k = `${r} | ${m}`; const c = issues.get(k) || new Set(); c.add(`${w}x${h}/${lang}`); issues.set(k, c) }
      }
      if (lang === 'pt' && (w === 320 || w === 1280 || w === 844)) {
        for (const r of ['/#/client/home', '/#/client/delivery']) { await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('hilda:v1')); s.user.role = 'client'; localStorage.setItem('hilda:v1', JSON.stringify(s)) }); await page.goto(BASE + r); await page.reload(); await page.waitForTimeout(600); await page.screenshot({ path: `${process.env.SHOTS || '/tmp/hilda-shots'}/vp-${w}x${h}-${r.split('/').pop()}.png` }) }
      }
      await ctx.close()
    }
  }
  const lines = [...issues.entries()].map(([k, v]) => `${k}  <${[...v].join(', ')}>`)
  console.log(lines.length ? lines.join('\n') : 'NO LAYOUT ISSUES')
  await browser.close()
})()
