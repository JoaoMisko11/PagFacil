-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyVia" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "TelegramOtp" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "TelegramOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TelegramOtp_chatId_code_idx" ON "TelegramOtp"("chatId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- AddForeignKey
ALTER TABLE "TelegramOtp" ADD CONSTRAINT "TelegramOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
