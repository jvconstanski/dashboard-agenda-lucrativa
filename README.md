# Dashboard Agenda Lucrativa

Painel do funil Agenda Lucrativa (Jonas Kaz). É um único `public/index.html` que lê a planilha ao vivo pelo navegador, ao abrir, a cada 5 minutos e no botão ↻. A senha fica no `middleware.js` (variável `DASH_SENHA` na Vercel). Cada push em `main` publica sozinho na Vercel.

## Onde mudar ticket, metas e regras
No `public/index.html`, procure o bloco `CFG` no começo do `<script>` (entre os comentários `CFG — bloco de configuração` e `fim do CFG`).

| Campo | O que é |
|---|---|
| `ticket` | R$ por ingresso. Tem que ser igual ao do relatório do WhatsApp. |
| `cpaAlvo` | CPA-alvo em R$ |
| `imposto` | fração sobre o gasto (0.1215 = 12,15%) |
| `inicio` | `AAAA-MM-DD`; tudo que vem antes fica de fora |
| `metas` | `ingressos`, `trafego`, `organico`, `investimento` (R$), `roas` |
| `status` | `cpaMult` (criativo com CPA acima de X × alvo vira "CPA alto"), `pausarSemCk` (R$ gastos sem checkout para virar "Pausar?") |
| `alertas` | limites dos avisos da Visão geral |
| `gids` | gid de cada aba da planilha |

O ⚙ do painel muda esses valores só no navegador de quem editou. Quando o valor no `CFG` mudar, o do ⚙ deixa de valer e passa a valer o do arquivo.

## `public/thumbs.js`
```js
window.THUMBS = ["DfgU5JfAGCG", "DfgU5KrAcX9"];
```
Uma lista de shortcodes. O shortcode é o fim do link do post (`instagram.com/p/<shortcode>/`), e a imagem fica em `public/t/<shortcode>.jpg`. Criativo sem shortcode na lista aparece com placeholder.

## `public/insights.js`
```js
window.INSIGHTS = {
  pagina: { url, hook, promessa, mecanismo, dor, desejo, cta, oferta, publico },
  elementos: [{ id, nome, tipo }],            // opcional
  criativos: { "JK_AL_05": { pct, hook, angulo, promessa, dor, desejo, cta,
                             bate: [], parcial: [], falta: [], contra: [] } },
  cobertura: [{ el, tipo, n, p }],             // n = cita completo, p = em parte
  achados: [], legenda, escopo, metodo, atualizado
};
```
A chave de `criativos` é o `Ad Name` (sem a campanha). O painel soma QUENTE + ADV daquele nome para mostrar gasto, CTR, checkouts e vendas ao vivo. Para comparar duas páginas, use `paginas: [{ id, nome, pagina, criativos, cobertura, achados, ... }]`, além de `comparativo: [{ ad, p1, p2 }]` e `comparativo_achados: []`.

## Testar local
```bash
cd public && python3 -m http.server 8765
```
Depois, abra http://localhost:8765. O portão de senha não roda local.
