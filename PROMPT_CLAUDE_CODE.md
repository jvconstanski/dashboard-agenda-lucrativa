# Prompt para o Claude Code: dashboard Agenda Lucrativa

Cole tudo abaixo no Claude Code, junto com a especificação visual completa (seções 0 a 10) que o João montou.

---

Você vai reconstruir o visual do dashboard do funil "Agenda Lucrativa" (Jonas Kaz) seguindo a ESPECIFICAÇÃO VISUAL anexada (seções 0 a 10). O Hermes, agente que roda no mesmo VPS, já cuida dos dados, dos relatórios e da publicação. Ele vai manter o dashboard atualizado depois que você terminar. Por isso, respeite o contrato abaixo à risca.

## 1. Onde está o projeto
- VPS, dentro do contêiner do Hermes: `/opt/data/projetos/dashboard-agenda-lucrativa/` (repositório git).
- GitHub: `jvconstanski/dashboard-agenda-lucrativa`, branch `main`. Cada push publica sozinho na Vercel em cerca de 30 segundos.
- Vercel: projeto `dashboard-agenda-lucrativa`. Domínio: https://dashboard-agendaslucrativas.jcnegociosdigitais.cloud
- Estrutura atual (não renomear):
  - `public/index.html`: o dashboard (é o arquivo que você reescreve)
  - `public/thumbs.js`: `window.THUMBS = ["<shortcode>", ...]`. A imagem fica em `public/t/<shortcode>.jpg`, e o shortcode é o fim do link do post (`instagram.com/p/<shortcode>/`).
  - `public/insights.js`: `window.INSIGHTS = {...}` (análise de copy; formato na seção 4)
  - `middleware.js`: portão de senha (variável `DASH_SENHA` na Vercel). NÃO alterar e NÃO colocar senha no código.
  - `vercel.json`, `package.json`: NÃO alterar.

## 2. Regras que não podem quebrar
1. Um único `public/index.html` autocontido (HTML + CSS + JS inline), Chart.js 4.4.x via CDN, Inter e Montserrat via Google Fonts. Pode carregar `thumbs.js` e `insights.js` com `<script src>`.
2. **Nada de dados mockados no arquivo final.** O objeto `DATA` da especificação deve ser montado a partir do fetch da planilha (seção 3). Se faltar dado, mostrar `--` em `--text3`. Nunca inventar número.
3. Não usar o login da especificação (seção 10): o portão de senha já existe no `middleware.js`. O botão "Sair" deve apontar para `/__sair`.
4. Sem chave, token ou senha no código.
5. Manter a leitura ao vivo: ler a planilha ao abrir, reler a cada 5 minutos e ter o botão ↻ para atualizar na hora.
6. Português do Brasil com acentuação. Formatação: `R$ 1.142,11`, `2,25%`, ROAS `0,03x` (use vírgula, para ficar igual ao relatório do WhatsApp), `--` para vazio.

## 3. Fonte de dados (somente leitura, pelo navegador)
Planilha `1bYmWzzWEkUP6NiVNP32jjfv9A9vIOZzCl4BxQiEcKME` (compartilhada por link). Ler cada aba por:
`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<GID>&tq=<query>`
(o `index.html` atual já tem um parser CSV pronto; reaproveite).

| Aba | gid | Colunas usadas |
|---|---|---|
| Meta Ads (Stract) | 1225783986 | Date (AAAA-MM-DD), Spend (Cost, Amount Spent) (vírgula decimal), Campaign Name, Adset Name, Ad Name, Impressions, Action Link Clicks, Action Landing Page View, Action Omni Initiated Checkout, Action Omni Purchase, Action Video View (3s), Video 15 Sec Watched Actions, Instagram Permalink URL, Website Purchase Roas |
| VENDAS | 121251726 | EMAIL, DATA (dd/mm/aaaa), UTM_MEDIUM (conjunto), UTM_CONTENT (anúncio), UTM_CAMPAIGN, UTM_SOURCE, RESPONDEU PESQUISA, PAGINA |
| CHECKOUTS | 1526104567 | EMAIL, DATA (dd/mm/aaaa hh:mm), COMPROU?, ATENDENTE, UTM_MEDIUM, UTM_CONTENT, UTM_CAMPAIGN |
| Pesquisa | 1162156478 | Submitted at, Sexo, Idade, Area de atuação, Produto, Renda, Você pensa em criar uma mentoria, Participações, Problema, Interesse, Email, utm_* |

Célula vazia conta como 0. Datas antes do início da campanha (09/11/2026) ficam de fora.

## 4. Regras de negócio (iguais ao relatório do Hermes)
- Bloco `CFG` no topo do script, editável pelo modal ⚙ e salvo em `localStorage`: `ticket`, `cpaAlvo`, `imposto` (12,15%), `inicio` ('2026-11-09'), metas (ingressos 350, tráfego 200, orgânico 150, investimento 30000, ROAS 0,25), regras de status do criativo, limites de alerta.
- **Ticket: [JOÃO, PREENCHA: R$ 27 ou R$ 37]**. O relatório do WhatsApp usa o mesmo valor, então os dois precisam bater.
- Vendas = linhas da aba VENDAS, sem repetir e-mail. Receita = vendas × ticket. O valor do pixel aparece só como referência.
- Investimento c/ imposto = gasto × (1 + imposto).
- CTR = cliques ÷ impressões; % Carregamento = LPV ÷ cliques; % Conv. Checkout = checkouts ÷ LPV; % Conv. Venda = vendas ÷ checkouts; % Conv. Página = vendas ÷ LPV; CPM = gasto ÷ impressões × 1000; CPA = gasto ÷ vendas; ROAS = receita ÷ gasto.
- Hook Rate = views 3s ÷ impressões. **Hold Rate = views 15s ÷ impressões** (a planilha não tem ThruPlay; escreva isso na legenda do card).
- Checkouts sem compra = COMPROU? diferente de SIM e e-mail fora da aba VENDAS. "A recuperar" = esses sem ATENDENTE.
- Criativo = `Ad Name` + variante da campanha (`QUENTE` ou `ADV`), no formato "JK_AL_17 (QUENTE)". O mesmo nome roda nas duas campanhas com posts diferentes, por isso a chave é nome + variante.
- Temperatura pelo nome da campanha/conjunto: QUENTE → 🔥 Quente; ADV → ⚡ Advantage; Morno e Frio só se aparecerem no nome (hoje não existem; mostrar zerados).
- Divergência pixel × planilha nas compras: sempre mostrar os dois números.

## 5. O que não tem fonte hoje (mostrar vazio, sem inventar)
- Orgânico, low ticket, order bump, downsell, vendas não traqueadas: a aba VENDAS não separa a origem. Regra provisória: venda sem UTM_CONTENT (ou com `{{`) = não traqueada; venda com UTM_SOURCE fora de Meta/Instagram/Facebook = orgânico. Seções sem dado ficam ocultas (order bump, low ticket, downsell) ou com `--`.
- Teste de página: agrupar pela coluna PAGINA da aba VENDAS. Hoje só existe a página https://www.jonaskazmentor.com.br/pdv-agl-2; a segunda página entra depois.
- "Fontes": listar as 4 abas acima com o link da planilha.

## 6. Oitava aba: Insights de copy
Adicionar a aba "Insights de copy" depois de "Fontes". Ler `window.INSIGHTS`:
`{pagina:{url,hook,promessa,mecanismo,dor,desejo,cta,oferta,publico}, criativos:{ "JK_AL_05":{pct,hook,angulo,promessa,dor,desejo,cta,bate[],parcial[],falta[],contra[]}, ...}, cobertura:[{el,tipo,n,p}], achados:[...], legenda, escopo, metodo, atualizado}`.
Mostrar achados, a página, a cobertura dos elementos e um card por criativo, com % de aderência, hook, ângulo, promessa, dor, desejo, CTA, o que bate / em parte / não aparece / contradiz, e ao lado o gasto, o CTR, os checkouts e as vendas ao vivo daquele anúncio. Usar o visual novo (cartões brancos, rótulos dourados).

## 7. Miniaturas e prévia
- Card de criativo: usar `t/<shortcode>.jpg` quando o shortcode estiver em `window.THUMBS`; senão, um placeholder. NÃO usar iframe do Instagram (é pesado e bloqueia). Botão "Ver" abre o permalink.

## 8. Antes de publicar
1. Testar local: `cd public && python3 -m http.server 8765` e abrir no navegador. Conferir que os números batem com o relatório de hoje (investimento acumulado R$ 1.018,38, 1 venda, CTR 2,25%, taxa de checkout 3,41%).
2. Conferir os breakpoints (1180, 1000, 900, 768 e 480 px) e que não sobra rolagem horizontal no celular.
3. Commit e push em `main`. Conferir o link publicado depois do login.
4. Escrever `README.md` curto com: onde fica o `CFG`, como trocar ticket e metas, formato de `thumbs.js` e `insights.js`.

## 9. Divisão de tarefas depois da entrega
- **Claude Code:** layout, componentes e novas abas.
- **Hermes:** manter os dados em dia. Ele baixa as miniaturas de criativos novos para `public/t/` e atualiza `thumbs.js`, refaz `insights.js` quando entra criativo ou página nova, ajusta `CFG` quando o João muda ticket ou meta, e publica com push. Então mantenha `thumbs.js`, `insights.js` e o bloco `CFG` fáceis de achar e editar.
