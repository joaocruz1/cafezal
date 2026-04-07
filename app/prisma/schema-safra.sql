-- NL Coffee — Schema completo com Safra/Kg (PostgreSQL)
-- Use para banco novo. Para migrar de Product/Category, use migration-safra.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL,
  profile TEXT NOT NULL CHECK (profile IN ('ADMIN', 'GERENTE', 'FINANCEIRO', 'VENDEDOR', 'ESTOQUE')),
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CoffeeHarvest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year INT NOT NULL,
  "pricePerKg" DECIMAL(10,2) NOT NULL,
  "kgPerBag" DECIMAL(10,2) NOT NULL,
  "minStockKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SystemSetting" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

CREATE TABLE "Order" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'FINALIZED', 'CANCELLED')),
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalizedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelReason" TEXT,
  "openedByUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "cancelledByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  total DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OrderItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "safraId" UUID NOT NULL REFERENCES "CoffeeHarvest"(id) ON DELETE RESTRICT,
  "quantityKg" DECIMAL(10,2) NOT NULL,
  bags INT NOT NULL DEFAULT 0,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  observation TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Payment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE RESTRICT,
  "paymentMethod" TEXT NOT NULL CHECK ("paymentMethod" IN ('CASH', 'CARD', 'PIX')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  "changeGiven" DECIMAL(10,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CashRegister" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "openingBalance" DECIMAL(10,2) NOT NULL,
  "closingBalance" DECIMAL(10,2),
  "openedByUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "closedByUserId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE TABLE "CashMovement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cashRegisterId" UUID NOT NULL REFERENCES "CashRegister"(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('SALE', 'MANUAL_IN', 'MANUAL_OUT')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  "orderId" UUID REFERENCES "Order"(id) ON DELETE SET NULL,
  "createdByUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "StockMovement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "safraId" UUID NOT NULL REFERENCES "CoffeeHarvest"(id) ON DELETE RESTRICT,
  "quantityKg" DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SALE', 'SALE_REVERT', 'ADJUSTMENT')),
  reason TEXT,
  "createdByUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  summary TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_order_status_opened_at ON "Order"(status, "openedAt");
CREATE INDEX idx_order_finalized_at ON "Order"("finalizedAt") WHERE status = 'FINALIZED';
CREATE INDEX idx_order_item_order ON "OrderItem"("orderId");
CREATE INDEX idx_order_item_safra ON "OrderItem"("safraId");
CREATE INDEX idx_payment_order ON "Payment"("orderId");
CREATE INDEX idx_cash_movement_register ON "CashMovement"("cashRegisterId");
CREATE INDEX idx_cash_movement_created ON "CashMovement"("createdAt");
CREATE INDEX idx_stock_movement_safra ON "StockMovement"("safraId");
CREATE INDEX idx_stock_movement_created ON "StockMovement"("createdAt");
CREATE INDEX idx_audit_log_created ON "AuditLog"("createdAt");
CREATE INDEX idx_audit_log_entity ON "AuditLog"("entityType", "entityId");
