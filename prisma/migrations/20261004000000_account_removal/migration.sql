-- Retain referenced academic records when removing a deactivated login account.
ALTER TABLE "User" ADD COLUMN "removedAt" TIMESTAMP(3);
