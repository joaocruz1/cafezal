-- =====================================================================
-- Cafezal — Script completo de criação do banco (Supabase / PostgreSQL)
-- Gerado a partir de prisma/schema.prisma
-- Rode este script inteiro no SQL Editor do Supabase (Dashboard > SQL Editor)
-- =====================================================================

-- Extensão necessária para gen_random_uuid()
create extension if not exists pgcrypto;

-- =====================================================================
-- ENUMS
-- =====================================================================
create type "Profile" as enum ('ADMIN', 'GERENTE', 'FINANCEIRO', 'VENDEDOR', 'ESTOQUE');
create type "OrderStatus" as enum ('OPEN', 'FINALIZED', 'CANCELLED');
create type "PaymentMethod" as enum ('CASH', 'CARD', 'PIX');
create type "CashRegisterStatus" as enum ('OPEN', 'CLOSED');
create type "CashMovementType" as enum ('SALE', 'MANUAL_IN', 'MANUAL_OUT');
create type "StockMovementType" as enum ('SALE', 'SALE_REVERT', 'ADJUSTMENT');

-- =====================================================================
-- TABLE: User
-- =====================================================================
create table "User" (
  "id"           uuid primary key default gen_random_uuid(),
  "email"        text not null unique,
  "passwordHash" text not null,
  "name"         text not null,
  "profile"      "Profile" not null default 'VENDEDOR',
  "active"       boolean not null default true,
  "createdAt"    timestamptz not null default now(),
  "updatedAt"    timestamptz not null default now()
);

-- =====================================================================
-- TABLE: CoffeeHarvest
-- =====================================================================
create table "CoffeeHarvest" (
  "id"         uuid primary key default gen_random_uuid(),
  "name"       text not null,
  "year"       integer not null,
  "pricePerKg" decimal(10,2) not null,
  "kgPerBag"   decimal(10,2) not null,
  "minStockKg" decimal(10,2) not null default 0,
  "active"     boolean not null default true,
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now()
);

-- =====================================================================
-- TABLE: SystemSetting
-- =====================================================================
create table "SystemSetting" (
  "id"    uuid primary key default gen_random_uuid(),
  "key"   text not null unique,
  "value" text not null
);

-- =====================================================================
-- TABLE: Order
-- =====================================================================
create table "Order" (
  "id"                uuid primary key default gen_random_uuid(),
  "identifier"        text not null,
  "status"            "OrderStatus" not null default 'OPEN',
  "openedAt"          timestamptz not null default now(),
  "finalizedAt"       timestamptz,
  "cancelledAt"       timestamptz,
  "cancelReason"      text,
  "openedByUserId"    uuid not null,
  "cancelledByUserId" uuid,
  "total"             decimal(10,2),
  "createdAt"         timestamptz not null default now(),
  "updatedAt"         timestamptz not null default now(),

  constraint "Order_openedByUserId_fkey"
    foreign key ("openedByUserId") references "User"("id") on delete restrict,
  constraint "Order_cancelledByUserId_fkey"
    foreign key ("cancelledByUserId") references "User"("id") on delete set null
);

-- =====================================================================
-- TABLE: OrderItem
-- =====================================================================
create table "OrderItem" (
  "id"          uuid primary key default gen_random_uuid(),
  "orderId"     uuid not null,
  "safraId"     uuid not null,
  "quantityKg"  decimal(10,2) not null,
  "bags"        integer not null default 0,
  "unitPrice"   decimal(10,2) not null,
  "observation" text,
  "createdAt"   timestamptz not null default now(),

  constraint "OrderItem_orderId_fkey"
    foreign key ("orderId") references "Order"("id") on delete cascade,
  constraint "OrderItem_safraId_fkey"
    foreign key ("safraId") references "CoffeeHarvest"("id") on delete restrict
);

-- =====================================================================
-- TABLE: Payment
-- =====================================================================
create table "Payment" (
  "id"            uuid primary key default gen_random_uuid(),
  "orderId"       uuid not null,
  "paymentMethod" "PaymentMethod" not null,
  "amount"        decimal(10,2) not null,
  "changeGiven"   decimal(10,2),
  "createdAt"     timestamptz not null default now(),

  constraint "Payment_orderId_fkey"
    foreign key ("orderId") references "Order"("id") on delete restrict
);

-- =====================================================================
-- TABLE: CashRegister
-- =====================================================================
create table "CashRegister" (
  "id"             uuid primary key default gen_random_uuid(),
  "openedAt"       timestamptz not null default now(),
  "closedAt"       timestamptz,
  "openingBalance" decimal(10,2) not null,
  "closingBalance" decimal(10,2),
  "openedByUserId" uuid not null,
  "closedByUserId" uuid,
  "status"         "CashRegisterStatus" not null default 'OPEN',

  constraint "CashRegister_openedByUserId_fkey"
    foreign key ("openedByUserId") references "User"("id") on delete restrict,
  constraint "CashRegister_closedByUserId_fkey"
    foreign key ("closedByUserId") references "User"("id") on delete set null
);

-- =====================================================================
-- TABLE: CashMovement
-- =====================================================================
create table "CashMovement" (
  "id"              uuid primary key default gen_random_uuid(),
  "cashRegisterId"  uuid not null,
  "type"            "CashMovementType" not null,
  "amount"          decimal(10,2) not null,
  "description"     text,
  "orderId"         uuid,
  "createdByUserId" uuid not null,
  "createdAt"       timestamptz not null default now(),

  constraint "CashMovement_cashRegisterId_fkey"
    foreign key ("cashRegisterId") references "CashRegister"("id") on delete restrict,
  constraint "CashMovement_orderId_fkey"
    foreign key ("orderId") references "Order"("id") on delete set null,
  constraint "CashMovement_createdByUserId_fkey"
    foreign key ("createdByUserId") references "User"("id") on delete restrict
);

-- =====================================================================
-- TABLE: StockMovement
-- =====================================================================
create table "StockMovement" (
  "id"              uuid primary key default gen_random_uuid(),
  "safraId"         uuid not null,
  "quantityKg"      decimal(10,2) not null,
  "type"            "StockMovementType" not null,
  "reason"          text,
  "createdByUserId" uuid not null,
  "createdAt"       timestamptz not null default now(),

  constraint "StockMovement_safraId_fkey"
    foreign key ("safraId") references "CoffeeHarvest"("id") on delete restrict,
  constraint "StockMovement_createdByUserId_fkey"
    foreign key ("createdByUserId") references "User"("id") on delete restrict
);

-- =====================================================================
-- TABLE: AuditLog
-- =====================================================================
create table "AuditLog" (
  "id"         uuid primary key default gen_random_uuid(),
  "userId"     uuid,
  "action"     text not null,
  "entityType" text not null,
  "entityId"   text,
  "summary"    text,
  "createdAt"  timestamptz not null default now(),

  constraint "AuditLog_userId_fkey"
    foreign key ("userId") references "User"("id") on delete set null
);

-- =====================================================================
-- ÍNDICES adicionais (foreign keys usadas em consultas/joins)
-- =====================================================================
create index "Order_openedByUserId_idx" on "Order"("openedByUserId");
create index "Order_cancelledByUserId_idx" on "Order"("cancelledByUserId");
create index "OrderItem_orderId_idx" on "OrderItem"("orderId");
create index "OrderItem_safraId_idx" on "OrderItem"("safraId");
create index "Payment_orderId_idx" on "Payment"("orderId");
create index "CashRegister_openedByUserId_idx" on "CashRegister"("openedByUserId");
create index "CashRegister_closedByUserId_idx" on "CashRegister"("closedByUserId");
create index "CashMovement_cashRegisterId_idx" on "CashMovement"("cashRegisterId");
create index "CashMovement_orderId_idx" on "CashMovement"("orderId");
create index "CashMovement_createdByUserId_idx" on "CashMovement"("createdByUserId");
create index "StockMovement_safraId_idx" on "StockMovement"("safraId");
create index "StockMovement_createdByUserId_idx" on "StockMovement"("createdByUserId");
create index "AuditLog_userId_idx" on "AuditLog"("userId");

-- =====================================================================
-- Fim do script
-- =====================================================================
