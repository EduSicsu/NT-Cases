const { chromium } = require('playwright')
const BASE = 'http://127.0.0.1:4173'
;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' })
  const A = await ctx.newPage(); const B = await ctx.newPage()
  A.setDefaultTimeout(8000); B.setDefaultTimeout(8000)
  const out = []
  const ok = async (n, f) => { try { await f(); out.push('PASS ' + n) } catch (e) { out.push('FAIL ' + n + ' :: ' + e.message.split('\n')[0]) } }
  await A.goto(BASE + '/#/login'); await A.waitForSelector('h1')
  await A.getByRole('button', { name: /cliente de exemplo/ }).click()
  await A.getByRole('heading', { name: 'O que vamos colher hoje?' }).waitFor()
  await B.goto(BASE + '/#/profile'); await B.getByRole('heading', { name: 'Perfil' }).first().waitFor()
  await B.getByRole('button', { name: /Trocar para produtor/ }).click()
  await B.getByRole('heading', { name: 'Pedidos' }).first().waitFor()
  await ok('tab A keeps being a customer after tab B became producer', async () => {
    await A.waitForTimeout(400)
    if (!(await A.evaluate(() => location.hash)).startsWith('#/client')) throw new Error('A redirected: ' + await A.evaluate(() => location.hash))
    await A.getByRole('heading', { name: 'O que vamos colher hoje?' }).waitFor()
  })
  await ok('order placed in A shows up live in B (producer)', async () => {
    await A.goto(BASE + '/#/client/item/herbs'); await A.getByRole('button', { name: /Adicionar à lista/ }).click()
    await A.goto(BASE + '/#/client/delivery'); await A.getByRole('button', { name: 'Enviar pedido ao produtor' }).click()
    await A.getByRole('heading', { name: 'Pedido enviado!' }).waitFor()
    await B.getByText('Pedido nº 129').waitFor()
  })
  await ok('producer accepts in B and A sees it live', async () => {
    await B.getByText('Pedido nº 129').click(); await B.getByRole('button', { name: 'Aceitar pedido' }).click()
    await B.getByText('Pedido aceito').waitFor()
    await A.getByRole('link', { name: /Pedidos/ }).click()
    await A.getByText('Pedido nº 129').click()
    await A.getByText('Produtor separando').first().waitFor()
  })
  console.log(out.join('\n')); await b.close()
})()
