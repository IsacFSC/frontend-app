-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "taskDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "_ConversationParticipants" ADD CONSTRAINT "_ConversationParticipants_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ConversationParticipants_AB_unique";
