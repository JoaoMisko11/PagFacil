-- CreateIndex
CREATE INDEX "Bill_userId_deletedAt_dueDate_idx" ON "Bill"("userId", "deletedAt", "dueDate");
