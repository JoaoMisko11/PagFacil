-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT');

-- CreateEnum
CREATE TYPE "BankTransactionMatchStatus" AS ENUM ('UNMATCHED', 'SUGGESTED', 'AUTO_MATCHED', 'USER_CONFIRMED', 'IGNORED');

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL,
    "pluggyItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankImageUrl" TEXT,
    "status" TEXT NOT NULL,
    "statusDetail" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "pluggyAccountId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "type" "BankAccountType" NOT NULL,
    "subtype" TEXT,
    "name" TEXT NOT NULL,
    "number" TEXT,
    "balance" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'BRL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "pluggyTransactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "pluggyCategory" TEXT,
    "type" TEXT NOT NULL,
    "matchedBillId" TEXT,
    "matchStatus" "BankTransactionMatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankConnection_pluggyItemId_key" ON "BankConnection"("pluggyItemId");

-- CreateIndex
CREATE INDEX "BankConnection_userId_idx" ON "BankConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_pluggyAccountId_key" ON "BankAccount"("pluggyAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_connectionId_idx" ON "BankAccount"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_pluggyTransactionId_key" ON "BankTransaction"("pluggyTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_matchedBillId_key" ON "BankTransaction"("matchedBillId");

-- CreateIndex
CREATE INDEX "BankTransaction_accountId_date_idx" ON "BankTransaction"("accountId", "date");

-- CreateIndex
CREATE INDEX "BankTransaction_matchStatus_idx" ON "BankTransaction"("matchStatus");

-- AddForeignKey
ALTER TABLE "BankConnection" ADD CONSTRAINT "BankConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BankConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_matchedBillId_fkey" FOREIGN KEY ("matchedBillId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
