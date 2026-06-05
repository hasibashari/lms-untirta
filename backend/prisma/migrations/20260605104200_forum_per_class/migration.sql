/*
  Warnings:

  - You are about to drop the column `courseId` on the `ForumThread` table. All the data in the column will be lost.
  - Added the required column `classId` to the `ForumThread` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ForumThread" DROP CONSTRAINT "ForumThread_courseId_fkey";

-- DropIndex
DROP INDEX "ForumThread_courseId_idx";

-- AlterTable
ALTER TABLE "ForumThread" DROP COLUMN "courseId",
ADD COLUMN     "classId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ForumThread_classId_idx" ON "ForumThread"("classId");

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
