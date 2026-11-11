# Símbolo "Produtos do Sítio" — vetor para Affinity

| Arquivo | O que é |
|---|---|
| `simbolo-produtos-do-sitio_1-literal.svg` / `.pdf` | **Modelo 1 — cópia literal.** Tudo em curvas (inclusive o texto), 16 cores chapadas, sem fontes. É a vetorização fiel da imagem enviada. |
| `simbolo-produtos-do-sitio_2-editavel.svg` / `.pdf` | **Modelo 2 — editável.** Textos vivos, camadas nomeadas, formas separadas. |
| `fontes/` | Fontes usadas no Modelo 2 (livres, licença OFL). **Instale antes de abrir.** |
| `previa/` | PNGs de conferência (fundo transparente). |
| `referencia/` | Imagem original recebida. |
| `src/` | Scripts que geraram os dois modelos. |

## Como abrir no Affinity
1. **Modelo 1:** `Arquivo > Abrir` e escolha o `.svg` (ou o `.pdf`). Cada cor está em camadas de curvas empilhadas.
2. **Modelo 2:** instale as 3 fontes da pasta `fontes/` (clique duplo > Instalar), **reinicie o Affinity**, depois abra o `.svg`.
3. Para salvar como `.afdesign`: `Arquivo > Salvar como`. (O formato nativo do Affinity só pode ser criado por ele.)

## Fontes do Modelo 2 (parecidas com as do símbolo)
- **Produtos do Sítio** → *Lobster* (script grosso, em terracota com contorno creme).
- **Anel (Projeto Missionário Renovo / Educação · Trabalho · Renda)** → *Domine Bold*.
- **Endereço e DESDE 2020** → *Roboto Condensed Bold*.

## Camadas do Modelo 2
`fundo` · `aneis` (anel marrom, 2 filetes, 2 arcos mostarda) · `sol` (disco + 13 raios) · `campos` (oliva/terracota + sulcos) · `arvores` · `fita` · `textos` (anel-topo, anel-base, titulo, endereco, desde).

## O que editar
- **Endereço:** duas linhas em `endereco-linha1` e `endereco-linha2`. O contorno creme fica em `endereco-contorno` (é uma cópia do texto; edite o mesmo texto nos dois).
- **Título:** `titulo-linha1/2` (cor) e `titulo-contorno` (halo creme). Mesma regra.
- **Texto em arco:** vêm como texto sobre curva. Se o Affinity importar como texto reto, refaça em 20 s: desenhe uma elipse (r ≈ 351 px no topo, 389 px na base, centro 512, 490), use a ferramenta **Texto Artístico**, clique sobre o contorno e digite.

## Limitações (transparência)
- Não tenho o Affinity aqui: conferi os arquivos em um navegador e em PDF, **não abri no Affinity**. Se algo vier diferente, me diga o que apareceu.
- As cores vêm em RGB (as da imagem). Para gráfica: `Documento > Configurar documento > Formato de cor: CMYK` e converta.
- Modelo 2: sulcos dos campos, sol e raios foram **reconstruídos** (medidos na imagem, não calcados); árvores e fita foram vetorizadas. Lobster é parecida, não idêntica, à letra original — letras e espaçamentos diferem um pouco.
- Modelo 1 parte de imagem de 1024 px: bordas ficam levemente suavizadas, ruídos do fundo kraft foram removidos.
