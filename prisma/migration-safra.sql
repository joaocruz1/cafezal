-- NL Coffee — Migração de Product/Category para Safra
-- Execute em banco que já tem o schema antigo.
-- ATENÇÃO: OrderItem e StockMovement serão recriados — dados serão perdidos.
-- Faça backup antes de executar.

-- 1. Remover dependências e tabelas antigas
DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "StockMovement";
DROP TABLE IF EXISTS "Product";
DROP TABLE IF EXISTS "Category";

-- 2. Criar CoffeeHarvest
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

-- 3. Inserir safra padrão
INSERT INTO "CoffeeHarvest" (id, name, year, "pricePerKg", "kgPerBag", "minStockKg", active)
VALUES (gen_random_uuid(), 'Safra 2024/2025', EXTRACT(YEAR FROM CURRENT_DATE)::INT, 0, 60, 0, true);

-- 4. Recriar OrderItem
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

-- 5. Recriar StockMovement
CREATE TABLE "StockMovement" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "safraId" UUID NOT NULL REFERENCES "CoffeeHarvest"(id) ON DELETE RESTRICT,
  "quantityKg" DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SALE', 'SALE_REVERT', 'ADJUSTMENT')),
  reason TEXT,
  "createdByUserId" UUID NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Índices
CREATE INDEX idx_order_item_order ON "OrderItem"("orderId");
CREATE INDEX idx_order_item_safra ON "OrderItem"("safraId");
CREATE INDEX idx_stock_movement_safra ON "StockMovement"("safraId");
CREATE INDEX idx_stock_movement_created ON "StockMovement"("createdAt");
