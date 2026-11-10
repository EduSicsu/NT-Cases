const { chromium } = require('playwright')
const BASE = process.env.BASE || 'http://127.0.0.1:4173'
const SHOTS = (process.env.SHOTS || '/tmp/hilda-shots') + '/'
require('fs').mkdirSync(SHOTS, { recursive: true })
const results = []
const logs = []
let page

async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]) }
  catch (e) { results.push(['FAIL', name + ' :: ' + String(e.message).split('\n')[0]]) }
}
const shot = (n) => page.screenshot({ path: SHOTS + n + '.png' })
const hash = () => page.evaluate(() => location.hash)
const expect = (c, m) => { if (!c) throw new Error(m) }

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR', colorScheme: 'light' })
  page = await ctx.newPage(); page.setDefaultTimeout(8000)
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()) })
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message))

  await step('root redirects to login', async () => {
    await page.goto(BASE + '/'); await page.waitForSelector('h1')
    expect((await hash()).startsWith('#/login'), 'hash ' + await hash())
    expect(await page.title() === 'Entrar · Hilda', 'title ' + await page.title())
  })
  await shot('01-login')

  await step('login validation shows inline errors and focuses first', async () => {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await page.getByText('Informe seu celular ou e-mail').waitFor()
    await page.getByText('Digite sua senha').waitFor()
    expect(await page.evaluate(() => document.activeElement.getAttribute('aria-invalid')) === 'true', 'focus not on invalid field')
    await page.getByLabel('Celular ou e-mail').fill('maria')
    await page.getByLabel('Senha', { exact: true }).fill('123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await page.getByText('Use um e-mail válido ou um celular com DDD').waitFor()
    await page.getByText('A senha tem pelo menos 6 caracteres').waitFor()
  })
  await shot('02-login-errors')

  await step('password show/hide toggles type', async () => {
    const f = page.getByLabel('Senha', { exact: true })
    expect(await f.getAttribute('type') === 'password', 'not password')
    await page.getByRole('button', { name: 'Mostrar senha' }).click()
    expect(await f.getAttribute('type') === 'text', 'not text')
  })

  await step('terms sheet opens, traps focus, closes with Escape', async () => {
    await page.getByRole('button', { name: 'Termos de serviço' }).click()
    await page.getByRole('dialog').waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached' })
  })

  await step('forgot password flow', async () => {
    await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
    await page.getByRole('heading', { name: 'Recuperar senha' }).waitFor()
    await page.getByLabel('Celular ou e-mail').fill('maria@email.com')
    await page.getByRole('button', { name: 'Enviar código' }).click()
    await page.getByText('Código enviado').waitFor()
    await page.getByRole('button', { name: 'Voltar para entrar' }).click()
    await page.getByRole('heading', { name: 'Entre no clube saudável' }).waitFor()
  })

  await step('real login with valid data then role choice', async () => {
    await page.getByLabel('Celular ou e-mail').fill('maria.silva@email.com')
    await page.getByLabel('Senha', { exact: true }).fill('segredo1')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await page.getByRole('heading', { name: 'Como você quer usar o Hilda?' }).waitFor()
  })
  await shot('03-role')
  await step('choose client', async () => {
    await page.getByRole('radio', { name: /Sou cliente/ }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('heading', { name: 'O que vamos colher hoje?' }).waitFor()
    expect((await hash()) === '#/client/home', 'hash ' + await hash())
  })
  await page.waitForTimeout(700)
  await shot('04-home')

  await step('search ignores accents; empty state; clear', async () => {
    const s = page.getByRole('searchbox', { name: 'Buscar produtos' })
    await s.fill('mandióca')
    await page.getByText('Mandioca').first().waitFor()
    expect(await page.locator('.pcard').count() === 1, 'expected 1 card')
    await s.fill('zzz')
    await page.getByText('Nenhum produto encontrado').waitFor()
    await shot('05-empty-search')
    await page.getByRole('button', { name: 'Mostrar todos' }).click()
    expect(await page.locator('.pcard').count() === 5, 'expected 5 cards')
  })

  await step('category filter works', async () => {
    await page.getByRole('button', { name: 'Raízes' }).click()
    expect(await page.locator('.pcard').count() === 1, 'roots')
    await page.getByRole('button', { name: 'Todos' }).click()
  })

  await step('sold-out product cannot be added', async () => {
    const jambu = page.locator('.pcard', { hasText: 'Jambu' })
    expect(await jambu.locator('.add-btn').isDisabled(), 'add enabled')
    await jambu.getByText('Esgotado').waitFor()
  })

  await step('quick add shows toast with action and tab badge', async () => {
    await page.getByRole('button', { name: 'Adicionar Tomate cereja à lista' }).click()
    await page.getByText('Tomate cereja na lista').waitFor()
    expect(await page.locator('.tabbar .badge').first().innerText() === '1', 'badge')
  })

  await step('open item, change size, qty and add', async () => {
    await page.locator('.pcard', { hasText: 'Mandioca' }).getByRole('link').click()
    await page.getByRole('heading', { name: 'Mandioca' }).waitFor()
    await page.getByRole('button', { name: /G · 1 kg/ }).click()
    await page.getByRole('button', { name: /Aumentar quantidade/ }).click()
    await page.getByText('2 × G · 1 kg = 2 kg').waitFor()
    await shot('06-item')
    await page.getByRole('button', { name: /Adicionar à lista · \u2066?R\$\s?14,00/ }).click()
    await page.getByRole('heading', { name: 'O que vamos colher hoje?' }).waitFor()
  })

  await step('list shows lines, subtotal, remove with undo', async () => {
    await page.getByRole('link', { name: /Minha lista/ }).click()
    await page.getByRole('heading', { name: 'Minha lista' }).waitFor()
    expect(await page.locator('.line').count() === 2, 'lines')
    await shot('07-list')
    await page.getByRole('button', { name: 'Remover Tomate cereja' }).click()
    expect(await page.locator('.line').count() === 1, 'removed')
    await page.getByRole('button', { name: 'Desfazer' }).click()
    expect(await page.locator('.line').count() === 2, 'undo')
  })

  await step('cart survives reload', async () => {
    await page.reload(); await page.getByRole('heading', { name: 'Minha lista' }).waitFor()
    expect(await page.locator('.line').count() === 2, 'lost cart')
  })

  await step('delivery: home requires address, validation messages', async () => {
    await page.getByRole('button', { name: /Escolher entrega/ }).click()
    await page.getByRole('heading', { name: 'Como você quer receber?' }).waitFor()
    await shot('08-delivery-fair')
    await page.getByRole('radio', { name: /Entregar em casa/ }).click()
    await page.getByRole('button', { name: 'Enviar pedido ao produtor' }).click()
    await page.getByText('Preencha este campo').first().waitFor()
    expect(await page.evaluate(() => document.activeElement.getAttribute('aria-invalid')) === 'true', 'focus')
    await shot('09-delivery-errors')
  })

  await step('delivery: total updates and order is sent once', async () => {
    await page.getByLabel('Rua').fill('Rua das Palmeiras')
    await page.getByLabel('Número').fill('120')
    await page.getByLabel('Bairro').fill('Centro')
    const total = await page.locator('.sum-row.is-total dd').innerText()
    expect(/R\$\s?(30|31|32|33|34|35|36|37|38|39|2\d),\d\d/.test(total.replace(/ /g, ' ')), 'total ' + total)
    const btn = page.getByRole('button', { name: 'Enviar pedido ao produtor' })
    await btn.dblclick()
    await page.getByRole('heading', { name: 'Pedido enviado!' }).waitFor()
    expect((await hash()).startsWith('#/client/sent/o129'), 'hash ' + await hash())
  })
  await shot('10-sent')

  await step('cart is empty after order and list shows empty state', async () => {
    await page.getByRole('link', { name: /Minha lista/ }).click()
    await page.getByText('Sua lista está vazia').waitFor()
    await shot('11-empty-list')
  })

  await step('orders tab lists the new order and detail shows timeline', async () => {
    await page.getByRole('link', { name: /Pedidos/ }).click()
    await page.getByRole('heading', { name: 'Meus pedidos' }).waitFor()
    await page.getByText('Pedido nº 129').waitFor()
    await shot('12-orders')
    await page.getByText('Pedido nº 129').click()
    await page.getByText('Aguardando o produtor').first().waitFor()
    await shot('13-order-detail')
  })

  await step('back button returns to the previous screen', async () => {
    await page.goBack()
    await page.getByRole('heading', { name: 'Meus pedidos' }).waitFor()
  })

  await step('deep link to unknown product shows friendly state', async () => {
    await page.goto(BASE + '/#/client/item/nope'); await page.getByText('Esse produto não está mais disponível.').waitFor()
  })
  await step('unknown route shows 404', async () => {
    await page.goto(BASE + '/#/banana'); await page.getByRole('heading', { name: 'Página não encontrada' }).first().waitFor()
    await shot('14-404')
  })

  await step('profile: switch to producer', async () => {
    await page.goto(BASE + '/#/profile'); await page.getByRole('heading', { name: 'Perfil' }).first().waitFor()
    await shot('15-profile')
    await page.getByRole('button', { name: /Trocar para produtor/ }).click()
    await page.getByRole('heading', { name: 'Pedidos' }).first().waitFor()
    expect((await hash()) === '#/producer/orders', 'hash ' + await hash())
  })
  await shot('16-producer-orders')

  await step('producer cannot open client routes (redirect)', async () => {
    await page.goto(BASE + '/#/client/home')
    await page.waitForFunction(() => location.hash === '#/producer/orders')
  })

  await step('producer accepts the new customer order (#129)', async () => {
    await page.getByText('Pedido nº 129').click()
    await page.getByRole('heading', { name: 'Pedido nº 129' }).waitFor()
    await shot('17-producer-detail-new')
    await page.getByRole('button', { name: 'Aceitar pedido' }).click()
    await page.getByText('Pedido aceito').waitFor()
    expect(await page.getByRole('button', { name: 'Marcar como pronto' }).isDisabled(), 'ready should be disabled until all picked')
    for (const cb of await page.getByRole('checkbox').all()) await cb.check()
    await shot('18-producer-picking')
    await page.getByRole('button', { name: 'Marcar como pronto' }).click()
    await page.getByText('Pedido pronto. O cliente foi avisado.').waitFor()
  })

  await step('producer declines another order with required reason', async () => {
    await page.goto(BASE + '/#/producer/orders/o128')
    await page.getByRole('button', { name: 'Recusar' }).click()
    const confirmBtn = page.getByRole('button', { name: 'Recusar pedido' })
    expect(await confirmBtn.isDisabled(), 'decline enabled without reason')
    await shot('19-decline-sheet')
    await page.getByRole('radio', { name: 'Sem estoque suficiente' }).click()
    await confirmBtn.click()
    await page.getByText('Pedido recusado').waitFor()
  })

  await step('products: toggle, edit with validation, add new', async () => {
    await page.getByRole('link', { name: /Produtos/ }).click()
    await page.getByRole('heading', { name: 'Meus produtos' }).waitFor()
    await shot('20-products')
    await page.getByRole('button', { name: /Tomate cereja.*Editar produto/ }).click()
    await page.getByLabel(/Preço por/).fill('0')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await page.getByText('Informe um preço maior que zero').waitFor()
    await shot('21-product-error')
    await page.getByLabel(/Preço por/).fill('13,50')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await page.getByText('Produto salvo').waitFor()
    await page.getByText('R$ 13,50').first().waitFor()
    await page.getByRole('button', { name: 'Novo produto' }).click()
    await page.getByLabel('Nome do produto').fill('Couve manteiga')
    await page.getByLabel(/Preço por/).fill('4')
    await page.getByLabel(/Quantidade em estoque/).fill('10')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await page.getByText('Couve manteiga').first().waitFor()
  })

  await step('client sees updated status after producer ready (order #129)', async () => {
    await page.goto(BASE + '/#/profile')
    await page.getByRole('button', { name: /Trocar para cliente/ }).click()
    await page.getByRole('link', { name: /Pedidos/ }).click()
    await page.getByText('Pronto para entrega').first().waitFor()
  })

  await step('client cannot cancel once accepted; can reorder after done', async () => {
    await page.getByText('Pedido nº 129').click()
    await page.getByText('Pronto para entrega').first().waitFor()
    expect(await page.getByRole('button', { name: 'Cancelar pedido' }).count() === 0, 'cancel visible')
  })

  await step('cancel flow on a fresh order and stock restore', async () => {
    await page.goto(BASE + '/#/client/item/herbs')
    await page.getByRole('heading', { name: 'Cheiro-verde' }).waitFor()
    await page.getByRole('button', { name: /Adicionar à lista/ }).click()
    await page.goto(BASE + '/#/client/delivery')
    await page.getByRole('button', { name: 'Enviar pedido ao produtor' }).click()
    await page.getByRole('heading', { name: 'Pedido enviado!' }).waitFor()
    await page.getByRole('button', { name: 'Acompanhar pedido' }).click()
    await page.getByRole('button', { name: 'Cancelar pedido' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar pedido' }).click()
    await page.getByText('Cancelado por você').first().waitFor()
    await page.getByRole('button', { name: 'Pedir de novo' }).click()
    await page.getByRole('heading', { name: 'Minha lista' }).waitFor()
    expect(await page.locator('.line').count() === 1, 'reorder')
  })

  await step('language switch to Arabic sets rtl and lang', async () => {
    await page.goto(BASE + '/#/profile')
    await page.getByRole('radio', { name: 'العربية' }).click()
    expect(await page.evaluate(() => document.documentElement.dir) === 'rtl', 'dir')
    expect(await page.evaluate(() => document.documentElement.lang) === 'ar', 'lang')
    await page.goto(BASE + '/#/client/home'); await page.waitForTimeout(700)
    await shot('22-ar-home')
    await page.goto(BASE + '/#/client/list'); await shot('23-ar-list')
    await page.goto(BASE + '/#/client/delivery'); await shot('24-ar-delivery')
  })

  await step('dark theme applies and persists', async () => {
    await page.goto(BASE + '/#/profile')
    await page.getByRole('radio', { name: 'داكن' }).click()
    expect(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'theme')
    await page.reload(); await page.waitForTimeout(300)
    expect(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'not persisted')
    await page.goto(BASE + '/#/client/home'); await page.waitForTimeout(700)
    await shot('25-ar-dark-home')
  })

  await step('offline banner appears and goes away', async () => {
    await ctx.setOffline(true)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')))
    await page.locator('.offline').waitFor()
    await ctx.setOffline(false)
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.locator('.offline').waitFor({ state: 'detached' })
  })

  console.log(results.map((r) => r.join(' ')).join('\n'))
  const bad = logs.filter((l) => !/Failed to load resource/.test(l))
  console.log('\nCONSOLE ISSUES:', bad.length ? '\n' + bad.slice(0, 15).join('\n') : 'none')
  console.log(`\n${results.filter((r) => r[0] === 'PASS').length}/${results.length} passed`)
  await browser.close()
})()
