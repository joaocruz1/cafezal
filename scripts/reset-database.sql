-- ============================================================
-- NL Coffee - Reset COMPLETO do banco de dados
-- DROP tudo, recria tudo do zero com enums corretos
-- ============================================================

-- =====================
-- 1. DROP TUDO
-- =====================

DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "StockMovement" CASCADE;
DROP TABLE IF EXISTS "CashMovement" CASCADE;
DROP TABLE IF EXISTS "CashRegister" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "CoffeeHarvest" CASCADE;
DROP TABLE IF EXISTS "SystemSetting" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

DROP CAST IF EXISTS (text AS "Profile");
DROP CAST IF EXISTS (text AS "OrderStatus");
DROP CAST IF EXISTS (text AS "PaymentMethod");
DROP CAST IF EXISTS (text AS "CashRegisterStatus");
DROP CAST IF EXISTS (text AS "CashMovementType");
DROP CAST IF EXISTS (text AS "StockMovementType");

DROP TYPE IF EXISTS "Profile" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "CashRegisterStatus" CASCADE;
DROP TYPE IF EXISTS "CashMovementType" CASCADE;
DROP TYPE IF EXISTS "StockMovementType" CASCADE;

-- =====================
-- 2. CREATE enums
-- =====================

CREATE TYPE "Profile" AS ENUM ('ADMIN', 'GERENTE', 'FINANCEIRO', 'VENDEDOR', 'ESTOQUE');
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'FINALIZED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'PIX');
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "CashMovementType" AS ENUM ('SALE', 'MANUAL_IN', 'MANUAL_OUT');
CREATE TYPE "StockMovementType" AS ENUM ('SALE', 'SALE_REVERT', 'ADJUSTMENT');

-- =====================
-- 3. CREATE tabelas
-- =====================

CREATE TABLE "User" (
    "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
    "email"        TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "profile"      "Profile" NOT NULL DEFAULT 'VENDEDOR',
    "active"       BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoffeeHarvest" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "year"        INTEGER NOT NULL,
    "pricePerKg"  DECIMAL(10,2) NOT NULL,
    "kgPerBag"    DECIMAL(10,2) NOT NULL,
    "minStockKg"  DECIMAL(10,2) NOT NULL DEFAULT 0,
    "active"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoffeeHarvest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSetting" (
    "id"    UUID NOT NULL DEFAULT gen_random_uuid(),
    "key"   TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier"        TEXT NOT NULL,
    "status"            "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt"       TIMESTAMP(3),
    "cancelledAt"       TIMESTAMP(3),
    "cancelReason"      TEXT,
    "openedByUserId"    UUID NOT NULL,
    "cancelledByUserId" UUID,
    "total"             DECIMAL(10,2),
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId"     UUID NOT NULL,
    "safraId"     UUID NOT NULL,
    "quantityKg"  DECIMAL(10,2) NOT NULL,
    "bags"        INTEGER NOT NULL DEFAULT 0,
    "unitPrice"   DECIMAL(10,2) NOT NULL,
    "observation" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
    "orderId"       UUID NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "amount"        DECIMAL(10,2) NOT NULL,
    "changeGiven"   DECIMAL(10,2),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashRegister" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "openedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt"        TIMESTAMP(3),
    "openingBalance"  DECIMAL(10,2) NOT NULL,
    "closingBalance"  DECIMAL(10,2),
    "openedByUserId"  UUID NOT NULL,
    "closedByUserId"  UUID,
    "status"          "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "cashRegisterId"  UUID NOT NULL,
    "type"            "CashMovementType" NOT NULL,
    "amount"          DECIMAL(10,2) NOT NULL,
    "description"     TEXT,
    "orderId"         UUID,
    "createdByUserId" UUID NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockMovement" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "safraId"         UUID NOT NULL,
    "quantityKg"      DECIMAL(10,2) NOT NULL,
    "type"            "StockMovementType" NOT NULL,
    "reason"          TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId"     UUID,
    "action"     TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId"   TEXT,
    "summary"    TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- =====================
-- 4. UNIQUE indexes
-- =====================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- =====================
-- 5. FOREIGN KEYS
-- =====================

ALTER TABLE "Order"
    ADD CONSTRAINT "Order_openedByUserId_fkey"
    FOREIGN KEY ("openedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order"
    ADD CONSTRAINT "Order_cancelledByUserId_fkey"
    FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_safraId_fkey"
    FOREIGN KEY ("safraId") REFERENCES "CoffeeHarvest"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashRegister"
    ADD CONSTRAINT "CashRegister_openedByUserId_fkey"
    FOREIGN KEY ("openedByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashRegister"
    ADD CONSTRAINT "CashRegister_closedByUserId_fkey"
    FOREIGN KEY ("closedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashMovement"
    ADD CONSTRAINT "CashMovement_cashRegisterId_fkey"
    FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CashMovement"
    ADD CONSTRAINT "CashMovement_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashMovement"
    ADD CONSTRAINT "CashMovement_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
    ADD CONSTRAINT "StockMovement_safraId_fkey"
    FOREIGN KEY ("safraId") REFERENCES "CoffeeHarvest"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockMovement"
    ADD CONSTRAINT "StockMovement_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================
-- 6. SEED dados iniciais
-- =====================

-- Usuario admin (senha: admin123)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "profile", "active", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'carlos@porteirademinas.com',
    '$2a$06$g5Gs8QEcJpOhawA3ePTxNeW/5e4Slmj23QmkqmWVRbAxxqpC9C70u',
    'Carlos',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Configuracoes padrao
INSERT INTO "SystemSetting" ("id", "key", "value")
VALUES
    (gen_random_uuid(), 'businessName', 'Porteira de Minas'),
    (gen_random_uuid(), 'orderPrefix', 'CMD');
