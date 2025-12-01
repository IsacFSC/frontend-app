-- AlterTable
ALTER TABLE "File" ADD COLUMN     "uploadedBy" INTEGER,
ADD COLUMN     "uploadthingKey" TEXT,
ADD COLUMN     "uploadthingUrl" TEXT;

-- CreateIndex
CREATE INDEX "File_uploadthingKey_idx" ON "File"("uploadthingKey");
