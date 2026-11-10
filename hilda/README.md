# Hilda · protótipo clicável (web)

App de orgânicos direto de quem planta, para a região amazônica. O cliente monta uma lista e escolhe como receber (feira, ponto de retirada ou em casa). O produtor recebe os pedidos nas quantidades certas e colhe sem desperdício.

Feito a partir do arquivo do Figma "Mobile case (Hilda)": mesmos tokens de cor (claro e escuro), DM Serif Display e DM Sans, e as fotos geradas para os produtos. Idiomas: português, inglês e árabe (da direita para a esquerda).

## Como testar

- **Cliente:** na entrada, toque em "Entrar como cliente de exemplo". Busque, adicione à lista, escolha a entrega e envie.
- **Produtor:** em Perfil, "Trocar para produtor" (ou "Entrar como produtor de exemplo"). Aceite, separe os itens, marque como pronto e conclua.
- **Os dois ao mesmo tempo:** abra duas abas do mesmo navegador. O perfil é de cada aba, os pedidos aparecem ao vivo nas duas.
- **Idioma e tema:** na entrada e em Perfil.
- **Começar de novo:** Perfil, "Restaurar dados de exemplo".

Os dados ficam no aparelho (`localStorage`). Não há servidor, pagamento nem login real.

## Rodar

```bash
cd hilda
npm install
npm run dev      # desenvolvimento
npm run build    # saída estática em dist/
```

Publicado na Vercel como projeto estático (Vite). Os endereços usam `#`, então não precisa de regra de reescrita.

## Estrutura

```
src/
  i18n.js        textos em pt, en e ar, moeda, data e plural
  data.js        produtos, preços, estoque e pedidos de exemplo
  store.jsx      estado, salvamento no aparelho, sincronização entre abas
  router.js      rotas com histórico (#/client/item/tomato)
  ui.jsx         componentes: botões, campos, abas, folhas, avisos, barra de abas
  screens/       entrada, cliente, produtor, perfil
tests/           verificações com Playwright e axe-core
UX-AUDIT.md      falhas de UX encontradas e como foram cobertas
```

## Verificações

Precisam de `playwright` e `axe-core` instalados (por exemplo `npm i --no-save playwright axe-core`) e do app rodando (`npm run build && npm run preview`).

```bash
node tests/e2e.cjs        # fluxos de cliente e produtor, 32 passos
node tests/two-tabs.cjs   # produtor e cliente em abas diferentes
node tests/a11y.cjs       # axe-core, WCAG 2.2 AA
node tests/layout.cjs     # 320px a 1280px, celular deitado, alvos de toque
```

Use `BASE=https://... ` para testar um endereço publicado.
