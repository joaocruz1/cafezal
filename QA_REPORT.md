# QA Report — Cafezal (sistema de gestão de café)

**Data:** 03/07/2026 · **Atualizado:** 03/07/2026 (após aplicação das correções)
**Ambiente:** `http://localhost:3000` (Next.js dev) + `server.js` (Socket.io, porta 3001) + Supabase (Postgres) remoto
**Usuário de teste:** `carlos@porteirademinas.com` (ADMIN)
**Método:** navegação real via Chromium (Playwright), fluxo completo de cada módulo, varredura de acessibilidade com `axe-core` em todas as páginas, inspeção do código-fonte para confirmar causa raiz antes de reportar. Todas as correções abaixo foram **aplicadas e reverificadas** (via banco de dados + nova varredura da UI + `axe-core` + `tsc --noEmit` + `next build`).

> Dados de teste ficaram no banco (safras "Safra Teste QA", "Safra Baixo Estoque", "Safra Preco Negativo", "Safra Atomic Retest", usuário "QA Vendedor", 1 caixa aberto/histórico de teste). Recomendo limpar antes de operar de verdade — posso fazer isso a pedido.

---

## Resumo executivo

| Severidade | Qtd | Status |
|---|---|---|
| 🔴 Crítico | 3 | ✅ Todos corrigidos e reverificados |
| 🟠 Alto | 2 | ✅ Todos corrigidos e reverificados |
| 🟡 Médio | 3 | ✅ 2 corrigidos · ⚪ 1 era falso positivo (retificado abaixo) |
| 🔵 Baixo | 2 | ✅ Todos corrigidos |
| ➕ Achados durante a verificação | 4 | ✅ Todos corrigidos (2 eram regressões minhas, 2 pré-existentes que só apareceram com dados reais) |

---

## 🔴 Críticos

### 1. Finalizar comanda com item que excede o estoque deixava "estoque fantasma" — ✅ CORRIGIDO

**Onde:** `app/api/orders/[id]/route.ts` (ação `finalize` e `cancel`), `lib/stock.ts`

O backend percorria os itens **em sequência** chamando `deductStock()` sem transação. Se o 1º item tinha estoque suficiente e o 2º não, o 1º já tinha o estoque baixado permanentemente antes do erro ser retornado — sem reversão.

**Confirmado antes da correção:** uma safra com 100kg iniciais e uma única venda de 5kg ficou com **90kg** em estoque (deveria ser 95kg).

**Correção aplicada:** `deductStock`/`revertStock`/`getCurrentStockKg` (`lib/stock.ts`) agora aceitam um cliente Prisma opcional (`Prisma.TransactionClient`). O fluxo de `finalize` e de `cancel` em `app/api/orders/[id]/route.ts` agora rodam dentro de `prisma.$transaction(...)` — qualquer falha no meio do processo reverte tudo (nenhuma baixa de estoque é persistida se a comanda não finalizar).

**Reverificado:** criei uma comanda com um item válido (4kg) + um item excedendo estoque (500kg de uma safra com 5kg). O "Finalizar" foi bloqueado com "Estoque insuficiente" e o item válido **manteve o estoque inalterado** (confirmado no banco antes/depois: 87.00kg → 87.00kg, sem nenhuma baixa fantasma).

---

### 2. Relatórios por período "somem" com as vendas do próprio dia — ✅ CORRIGIDO

**Onde:** `app/api/reports/{sales,by-payment,top-products,cancelled,cash-movements}/route.ts`, `app/api/dashboard/route.ts` (novo helper: `lib/date.ts`)

`new Date("2026-07-03")` (string de data pura) é interpretado em UTC; em seguida `.setHours(23,59,59,999)` aplicava o horário no fuso **local do processo Node** (`America/Sao_Paulo`, UTC-3). O limite superior do intervalo ficava ~3h mais cedo que o esperado, escondendo praticamente todas as vendas do dia corrente (e o comportamento mudaria dependendo do fuso do servidor de produção — em dev era UTC-3, no Vercel seria UTC).

**Correção aplicada:** criei `lib/date.ts` com `businessDayBounds(dateStr)` (limites fixos em `-03:00`, independentes do fuso do processo) e `todayInBusinessTimezone()`/`shiftDateStr()`. Apliquei em todos os 5 endpoints de relatório **e** no dashboard (que "acertava por coincidência" em dev, mas tinha o mesmo problema latente).

**Reverificado:** venda de R$227,50 e os 3 movimentos de caixa do dia agora aparecem corretamente em Relatórios → Vendas e Relatórios → Mov. caixa, com os mesmos valores do Dashboard.

---

### 3. Preço por kg (e kg/saco) aceitavam valores negativos ou zero — ✅ CORRIGIDO

**Onde:** `app/api/safras/route.ts` (POST), `app/api/safras/[id]/route.ts` (PATCH), `app/(dashboard)/safras/page.tsx`

**Correção aplicada:** validação `pricePerKg > 0` e `kgPerBag > 0` no backend (criação e edição), com erro 400 claro; `min="0.01"` nos inputs do formulário.

**Reverificado:** tentativa de criar safra com preço `-5` agora é bloqueada pelo navegador (`min` nativo); chamada direta à API com `pricePerKg: -1` e `kgPerBag: 0` retornam `{"error":"Preço por kg deve ser maior que zero"}` / `{"error":"Kg por saco deve ser maior que zero"}`.

---

## 🟠 Altos

### 4. Abrir caixa com "Valor inicial" vazio abria com R$ 0,00 sem avisar — ✅ CORRIGIDO

**Onde:** `app/(dashboard)/caixa/page.tsx`, `app/api/cash/route.ts`

`Number("")` retorna `0`, não `NaN` — a validação não pegava o campo vazio. Corrigido tanto no front (checagem explícita de string vazia antes da conversão) quanto na API (rejeita `openingBalance` ausente/vazio/NaN).

**Reverificado:** clicar em "Abrir caixa" com o campo vazio agora mostra o toast "Informe o valor inicial" e não abre o caixa.

---

### 5. Não havia forma de corrigir a quantidade de um item sem removê-lo e readicionar — ✅ CORRIGIDO

A API já suportava `PATCH /api/orders/[id]/items/[itemId]` com nova quantidade — só faltava expor isso na UI. Adicionei um botão "Editar" (ícone lápis) em cada item da comanda no PDV, abrindo um modal com preview de subtotal em tempo real.

**Reverificado:** adicionei um item de 10kg, editei para 20kg pelo novo botão — total atualizado corretamente (10 → 20kg, R$455 → R$910) sem precisar remover/readicionar.

---

## 🟡 Médios

### 6. ~~Tabelas cortam colunas no mobile~~ — ⚪ FALSO POSITIVO (retificado)

Esse item do relatório original foi baseado em uma leitura equivocada: o projeto tem **dois diretórios de componentes UI duplicados** (`components/ui/*`, realmente usado via `@/components/ui`, e um `app/components/ui/*` morto, não importado por nada — ver seção "Descoberta extra" abaixo). Eu tinha inspecionado o arquivo morto. O `Table.tsx` **realmente usado** já envolve a tabela em `<div className="overflow-x-auto">`. Confirmei via DOM ao vivo no mobile (390px): `scrollWidth (389) > clientWidth (298)` — a tabela **rola horizontalmente** normalmente; a screenshot estática apenas não conseguia capturar isso. Nenhuma alteração de código necessária.

---

### 7. Labels de formulário sem associação programática — ✅ CORRIGIDO (nos 2 casos reais confirmados)

Mesma ressalva do item 6: os componentes `Input`/`Select` reais (raiz) **já** usam `useId()`/`htmlFor`/`id` corretamente — não tinham o bug que descrevi (baseado no diretório morto). Os dois casos que o `axe-core` realmente confirmou ao vivo, e que foram corrigidos:

- **PDV → seletor "Selecionar comanda aberta..."**: não recebia `label` nem `aria-label` → adicionado `aria-label="Selecionar comanda aberta"`.
- **Vendas → seletor de período** ("Hoje" / "Últimos 7 dias"): mesmo problema, não estava no relatório original mas apareceu na revarredura → adicionado `aria-label="Periodo"`.
- **Relatórios → filtro de data (De/Até)**: `DateRangePicker` renderizava `<label>` manualmente sem `htmlFor`/`id` → adicionado `useId()` + associação correta.

**Reverificado:** varredura `axe-core` em todas as 10 páginas (9 do dashboard + login) agora retorna **0 violações** em todas.

---

### 8. Configuração "Nome do estabelecimento" não tinha efeito na UI — ✅ CORRIGIDO

Adicionei busca da configuração no layout do dashboard e exibição como subtítulo abaixo do logo "Cafezal" na sidebar.

**Reverificado:** alterei o nome para "Cafezal Test QA" em Configurações → aparece imediatamente como subtítulo na sidebar (desktop e mobile).

---

## 🔵 Baixos

### 9. `<aside role="navigation">` — role ARIA redundante/inválido — ✅ CORRIGIDO

Trocado por `<aside>` (sem role explícito — landmark implícito `complementary`) envolvendo todo o conteúdo da sidebar, com um `<nav aria-label="Menu principal">` interno só para a lista de links (evita nav aninhado). Isso também manteve todo o conteúdo da sidebar dentro de um landmark (ver achado extra "region" abaixo).

### 10. Servidor de tempo real (Socket.io) não subia junto com `npm run dev` — ✅ CORRIGIDO

Adicionado `concurrently` como dependência de dev e um novo script `npm run dev:all` que sobe Next.js + `server.js` juntos. README atualizado para recomendar `dev:all`.

---

## ➕ Achados durante a verificação das correções

Ao reverificar com `axe-core`, apareceram 4 problemas que **não** estavam na lista original — 2 eram regressões que eu mesmo introduzi ao corrigir o item 9, e 2 são bugs pré-existentes que só ficaram visíveis com dados reais na tela (o scan original rodou com o sistema vazio). Todos corrigidos:

- **Regressão minha:** ao trocar `<aside role="navigation">` por `<div>` simples, todo o conteúdo fora do `<nav>` interno (logo, nome do estabelecimento, perfil do usuário, botão Sair) ficou fora de qualquer landmark (`region`, moderado). Corrigido voltando o container externo para `<aside>` (sem `role` explícito).
- **Regressão minha:** o subtítulo do nome do estabelecimento que adicionei usava `text-stone-500` sobre fundo escuro (`bg-stone-900`) — contraste 3.65:1 (mínimo exigido: 4.5:1). Corrigido para `text-stone-400`, mesmo tom já usado nos outros textos secundários da sidebar.
- **Pré-existente:** timestamps em `text-xs text-stone-400` sobre fundo branco em "Comandas recentes" (Dashboard) e "Vendas recentes" (Vendas) têm contraste insuficiente (2.58:1). Só apareceu porque o scan inicial rodou antes de existirem comandas/vendas reais. Corrigido para `text-stone-500` (mesmo padrão usado em outros textos secundários sobre fundo claro no restante do app), e apliquei a mesma correção a 3 ocorrências equivalentes no PDV e 1 no rodapé do login.
- **Pré-existente:** página de login sem landmark `<main>` — o skip-link global (`#main-content`, definido em `app/layout.tsx`) não tinha alvo nessa página (`landmark-one-main`, `region`, `skip-link`). Corrigido envolvendo o conteúdo da página em `<main id="main-content">`.

**Resultado final:** varredura `axe-core` em `/login` + todas as 9 páginas do dashboard → **0 violações em todas**.

---

## Descoberta extra (não corrigida — decisão do usuário)

O projeto tem **árvores de arquivos inteiras duplicadas e mortas**, não referenciadas por nenhum import:
- `app/components/` (subset de `components/`)
- `app/lib/` (cópia de `lib/`)
- `app/prisma/` (cópia de `prisma/`, incluindo um `schema.prisma` levemente diferente)

Confirmei via grep que nada importa desses caminhos (`@/*` no `tsconfig.json` aponta para a raiz do projeto, não para `app/`). Isso quase me fez basear correções em arquivos errados (foi exatamente o que aconteceu com os itens 6 e 7 do relatório original). Recomendo apagar essas três pastas — não fiz isso automaticamente por ser uma limpeza destrutiva fora do escopo de "corrigir os bugs", mas fica fácil de confirmar e remover a pedido.

---

## O que já funcionava bem (validado ponta a ponta, sem alterações)

- Login/logout, proteção de rotas por perfil, usuário bloqueado corretamente impedido de logar.
- Fluxo completo de venda: abrir comanda → adicionar item → finalizar → pagar → baixa de estoque → aparece em "Vendas em tempo real" via socket → aparece no Dashboard e em Comandas, todos com valores batendo.
- Caixa: abertura, entrada/saída manual, cálculo de saldo esperado, validação de campos obrigatórios na movimentação manual.
- Usuários: criação, senha mínima de 6 caracteres, e-mail duplicado bloqueado, formato de e-mail validado, bloqueio de usuário efetivo, usuário não pode bloquear a si mesmo.
- Modal (`components/ui/Modal.tsx`): acessibilidade acima da média — focus trap, Esc fecha, `aria-modal`/`aria-labelledby`, foco retorna ao elemento anterior.
- `Input`/`Select` (raiz, os realmente usados): já usam `useId()` + `htmlFor`/`id` corretamente.
- `lang="pt-BR"` no `<html>`.

---

## Verificação final rodada após todas as correções

- `npx tsc --noEmit` — sem erros.
- `npm run build` — build de produção completo sem erros.
- `npm run lint` — sem erros novos (alguns pré-existentes em arquivos não tocados, fora de escopo).
- Varredura `axe-core` nas 10 páginas (login + 9 do dashboard) — **0 violações**.
- Smoke test completo: login → navegação por todas as páginas → sem erros de console/rede.
