/*
  Warnings:

  - You are about to drop the column `file` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `fileMimeType` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `file` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `fileMimeType` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "file",
DROP COLUMN "fileMimeType";

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "file",
DROP COLUMN "fileMimeType";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar";

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
