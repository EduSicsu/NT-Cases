# Hilda · auditoria de UX e o que foi coberto na versão web

Este documento lista as falhas de UX que encontrei ao revisar as telas do Figma (e o case original) e o que mudou no app publicado para que a navegação funcione sem tropeços. A gravidade segue a regra: **alta** = o usuário não consegue concluir a tarefa ou perde dados; **média** = concluir exige adivinhar; **baixa** = polimento.

## 1. Fluxo e informação

| # | Falha | Onde | Gravidade | Como foi coberta |
|---|---|---|---|---|
| 1 | A aba **Pedidos** do cliente e a aba **Perfil** existiam na barra, mas não tinham tela. "Acompanhar pedido" levava a um beco sem saída. | Figma, cliente | Alta | Telas de pedidos (em andamento e anteriores), detalhe com andamento e perfil. |
| 2 | A lista misturava produtos de três sítios, mas o pedido ia para um só produtor. | Lista e entrega | Alta | O protótipo usa um produtor só (Sítio Boa Terra), sem prometer o que não entrega. **Decisão em aberto:** num produto real, o carrinho precisa virar um pedido por produtor. |
| 3 | A Mandioca aparecia como "Esgotado" na tela do produtor e, ao mesmo tempo, dentro da lista do cliente. | Dados | Alta | Um estoque único alimenta as duas pontas. O pedido desconta do estoque; recusar ou cancelar devolve. A lista é ajustada ao estoque antes de enviar e avisa o que mudou. O Jambu mostra o estado "esgotado". |
| 4 | Faixas de tamanho (P, M, G) apareciam em produtos vendidos por unidade ou maço, e o preço de cada uma não era claro. | Item | Média | Tamanhos só para produtos vendidos por peso. Mostra a conta ("2 × M · 500 g = 1 kg") e o total muda na hora. |
| 5 | Sem limite de quantidade nem aviso de estoque. | Item e lista | Média | Máximo pelo estoque real, aviso "Só restam…" e mensagem ao atingir o limite. |
| 6 | A lista não tinha remover, desfazer, limpar nem estado vazio. | Lista | Alta | Remover com **Desfazer**, limpar lista com desfazer e estado vazio com ação. |
| 7 | Entrega: sem endereço, sem escolha de dia, e o custo extra só aparecia depois. | Entrega | Alta | O custo aparece em cada opção, o total muda ao escolher, há dia para feira e ponto, e endereço obrigatório e validado para entrega em casa. |
| 8 | O cliente não podia cancelar, e o produtor não podia recusar. | Pedidos | Alta | Cliente cancela só antes de o produtor aceitar (com confirmação). Recusar exige um motivo, que o cliente vê. |
| 9 | O produtor não tinha como separar o pedido nem saber o total a colher. | Produtor | Alta | Lista de separação com progresso, "Marcar como pronto" só depois de separar tudo e o total a colher por produto. |
| 10 | Produtos do produtor: sem editar preço ou estoque, sem criar produto. | Produtos | Média | Edição e criação com validação. Estoque zero vira "esgotado". |
| 11 | No case original, as telas de Pedidos usavam outro estilo (verde neon, texto minúsculo), rótulos que não combinavam ("Feitos" e "Finalizados") e cartões idênticos. | Case | Média | Mesmo sistema visual do resto, um vocabulário de status único, cartões com itens, total e horário. |

## 2. Entrada e conta

| # | Falha | Gravidade | Como foi coberta |
|---|---|---|---|
| 12 | Sem estados de erro, sem mostrar a senha, e "Esqueci minha senha", "Termos" e "Criar conta" sem destino. | Alta | Validação em linha, com foco no primeiro campo com erro. Mostrar e ocultar senha, recuperar senha, criar conta e termos e privacidade em folha. |
| 13 | O perfil (cliente ou produtor) era pedido de novo a cada entrada. | Média | O perfil escolhido fica lembrado e pode ser trocado em Perfil. |
| 14 | Quem só quer conhecer o app precisa inventar uma conta. | Média | Dois atalhos: entrar como cliente ou produtor de exemplo. |
| 15 | Idioma e tema só existiam no Figma. | Média | Escolha de idioma (PT, EN, AR) e tema na entrada e em Perfil. Segue o idioma e o tema do aparelho na primeira visita. |

## 3. Navegação e estado

| # | Falha | Gravidade | Como foi coberta |
|---|---|---|---|
| 16 | Sem endereço por tela: atualizar a página, voltar ou compartilhar um link perdia o lugar. | Alta | Cada tela tem URL (`#/client/item/tomato`). Voltar funciona, links diretos funcionam, e quem abre direto uma tela interna e toca em voltar cai na tela-pai. |
| 17 | Rotas sem guarda: uma tela do outro perfil abria. | Média | Guardas por login e perfil, com retorno ao destino depois de entrar (`?next=`). Rota inexistente mostra uma página amigável. |
| 18 | Dados perdidos ao recarregar. | Alta | Lista, pedidos, estoque, idioma, tema e perfil ficam salvos no aparelho. O perfil é de cada aba, então dá para testar o produtor numa aba e o cliente na outra, com os pedidos aparecendo ao vivo nas duas. |
| 19 | Enviar o pedido com duplo toque podia duplicar. | Média | O botão trava ao enviar (e mostra "Enviando…"), e o estoque é conferido de novo antes de enviar. |
| 20 | Sem feedback ao adicionar, remover ou aceitar. | Média | Avisos curtos no topo (não cobrem o botão principal), com **Desfazer** quando faz sentido, anunciados por leitor de tela. |
| 21 | Sem estados de carregamento, sem internet ou imagem quebrada. | Média | Esqueleto na primeira carga, faixa de "sem internet" e bloco de cor com ícone quando a foto falha. |
| 22 | A posição da rolagem e o foco se perdiam ao trocar de tela. | Baixa | A rolagem é lembrada por tela, e o foco vai para o título da nova tela. |

## 4. Acessibilidade

| # | Falha | Gravidade | Como foi coberta |
|---|---|---|---|
| 23 | Alvos de toque de 30px (quantidade) e 32px (alternador), textos de 12px. | Alta | Todo controle tem pelo menos 44 × 44 px. Texto corrido a partir de 14px (selos de 12–13px). |
| 24 | Controles só com ícone, sem nome. | Alta | Todos têm nome acessível, e os nomes contêm o texto visível. |
| 25 | Abas, opções e caixas sem semântica nem teclado. | Alta | `tablist` com setas, `radiogroup` com setas, interruptores com `role="switch"`, folhas com foco preso e **Esc** para fechar, e o foco volta ao botão que abriu. |
| 26 | Status só por cor. | Média | Todo status tem ícone e texto. A aba ativa tem fundo, não só cor. |
| 27 | Sem marcos de página e sem "pular para o conteúdo". | Média | `main`, `nav`, `footer`, link para pular, `lang` e `dir` corretos no `html`. |
| 28 | Movimento sem opção de reduzir. | Baixa | `prefers-reduced-motion` respeitado. |

## 5. Idiomas e direção

| # | Falha | Gravidade | Como foi coberta |
|---|---|---|---|
| 29 | Mistura de português e inglês nas mesmas telas. | Média | Um dicionário por idioma, sem mistura. |
| 30 | Árabe: o texto espelhava, mas o "R$" aparecia invertido e a ordem dos números mudava ("7ص–12م"). | Média | Moeda isolada da direção do texto, `Intl` para moeda, data e plural, horários escritos com "من … إلى …" e setas espelhadas. |
| 31 | Plurais fixos ("1 itens"). | Baixa | Regras de plural de cada idioma (o árabe tem seis formas). |

## 6. Telas pequenas, grandes e desempenho

| # | Falha | Gravidade | Como foi coberta |
|---|---|---|---|
| 32 | Em 320px, preço e linha da lista estouravam o cartão, e a busca cortava o texto. | Alta | Grade e linhas reorganizadas, texto da busca mais curto. Verificado de 320px a 1280px. |
| 33 | Celular deitado: o rodapé fixo ocupava quase metade da altura. | Média | Estilos para telas baixas. |
| 34 | No computador, o app esticava como um site comum. | Baixa | Moldura de celular centralizada em telas largas, tela cheia no celular, com áreas seguras do iPhone. |
| 35 | Fontes de terceiros, piscar do tema errado e imagens sem tamanho. | Média | Fontes embutidas (nenhum pedido a terceiros), tema e idioma aplicados antes da primeira pintura, imagens WebP em dois tamanhos com `srcset` e dimensões fixas (sem salto de layout). 77 KB de JavaScript comprimido. |

## Como foi verificado

- **Fluxos de ponta a ponta (Chromium, 32 passos):** entrada com erros, recuperar senha, cadastro, busca sem acento, filtros, adicionar, lista com desfazer, recarregar, entrega com validação, envio com duplo toque, produtor aceita, separa e conclui, recusa com motivo, edição de produto, cancelar, árabe, tema escuro, sem internet. **32 de 32**, console sem erros ou avisos.
- **axe-core (WCAG 2.2 AA e boas práticas):** 0 violações nas telas principais, em português claro, português escuro, árabe e inglês escuro.
- **Layout:** 320, 360, 390, 430 e 768px, 1280px e celular deitado, em português e árabe, sem rolagem horizontal, sem texto cortado e sem alvos de toque abaixo de 44px. A única exceção é a faixa de abas do produtor, que rola de propósito (com sombra indicando que há mais abas).

Os scripts estão em `tests/`.

## Limites e decisões em aberto

- **Sem servidor:** não há login real, pagamento nem notificações. Os dados ficam no aparelho (e sincronizam entre abas do mesmo navegador, não entre aparelhos).
- **Um produtor só:** veja a falha 2. É a decisão de produto mais importante para a próxima fase.
- **Fotos:** quatro produtos têm foto gerada por IA. Produtos criados pelo produtor e o Jambu usam um bloco de cor com ícone, até haver foto.
- **Endereços (URLs):** usam `#` para funcionar em qualquer hospedagem. Dá para trocar por caminhos limpos se o site precisar.
- **Tradução:** o árabe e o inglês foram escritos por mim e merecem revisão de quem fala o idioma.
