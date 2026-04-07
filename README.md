# NL Coffee — Sistema de gestão para Café

Sistema de gestão com comandas, caixa, estoque, relatórios, usuários e permissões (Admin / Atendente). Stack: Next.js 16 (App Router), Prisma (ORM), Tailwind CSS.

## Funcionalidades

- **PDV / Comandas:** abrir comanda, adicionar/remover itens, finalizar, pagamento (dinheiro, cartão, Pix), cancelamento com motivo.
- **Caixa:** abertura com valor inicial, vendas lançadas automaticamente, entradas/saídas manuais, fechamento com conferência, histórico.
- **Estoque:** baixa automática (ao adicionar item ou ao pagar, configurável), ajustes manuais com motivo, alerta de estoque mínimo, histórico.
- **Cadastros:** produtos (preço, categoria, controle de estoque), categorias (ordenação), usuários (perfil Admin/Atendente).
- **Relatórios:** vendas por período, faturamento por forma de pagamento, produtos mais vendidos, comandas canceladas, movimentações de caixa, estoque baixo.
- **Configurações:** nome do estabelecimento, regra de baixa de estoque, estoque negativo, exigir caixa aberto para venda.
- **Auditoria:** registros de abertura/fechamento de caixa, cancelamento, ajustes de estoque, alteração de preço/config e usuários.

## Setup

1. **Banco de dados:** crie um banco PostgreSQL e aplique o SQL das tabelas (está no plano de desenvolvimento em `.cursor/plans/` ou no final do documento de especificação). Não é necessário rodar `prisma migrate` se você aplicar o SQL manualmente.

2. **Variáveis de ambiente:** copie `.env.example` para `.env` e preencha:
   - `DATABASE_URL` — connection string PostgreSQL (ex.: `postgresql://user:password@localhost:5432/nl_coffee`)
   - `JWT_SECRET` — segredo para JWT (mín. 32 caracteres em produção)

3. **Prisma Client:** após as tabelas existirem no banco, rode:
   ```bash
   npx prisma generate
   ```

4. **Primeiro usuário (admin):** após o banco e o `prisma generate`:
   ```bash
   npm run seed
   ```
   Cria usuário `admin@cafe.local` com senha `admin123` (ou use `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env`).

5. **Aplicação:**
   ```bash
   npm install
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000), faça login e use o PDV em **PDV / Comandas**.

## Perfis

- **Admin:** configurações, produtos, categorias, estoque (ajustes), caixa (abrir/fechar e histórico), relatórios, usuários.
- **Atendente:** PDV, comandas, pagamento, ver produtos, caixa do dia (entradas/saídas manuais). Sem acesso a configurações, usuários ou relatórios sensíveis (ex.: canceladas).

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor de produção
- `npm run seed` — criar usuário admin inicial (requer banco e `prisma generate`)
- `npm run lint` — ESLint
