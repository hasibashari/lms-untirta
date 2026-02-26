/*
  Warnings:

  - You are about to drop the `SemesterStatusLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SemesterStatusLog" DROP CONSTRAINT "SemesterStatusLog_academicSemesterId_fkey";

-- DropForeignKey
ALTER TABLE "SemesterStatusLog" DROP CONSTRAINT "SemesterStatusLog_performedBy_fkey";

-- DropTable
DROP TABLE "SemesterStatusLog";
