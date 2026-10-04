CREATE TABLE "EvidenceUpload" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "evidenceId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceUpload_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EvidenceUpload_storageKey_key" ON "EvidenceUpload"("storageKey");
CREATE INDEX "EvidenceUpload_ownerId_createdAt_idx" ON "EvidenceUpload"("ownerId", "createdAt");
CREATE INDEX "EvidenceUpload_expiresAt_status_idx" ON "EvidenceUpload"("expiresAt", "status");
ALTER TABLE "EvidenceUpload" ADD CONSTRAINT "EvidenceUpload_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
