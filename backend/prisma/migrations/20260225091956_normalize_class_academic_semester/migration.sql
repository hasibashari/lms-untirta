/*
  Warnings:

  - You are about to drop the column `academicYear` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `semesterType` on the `Class` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId,academicSemesterId,section]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - Made the column `academicSemesterId` on table `Class` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_academicSemesterId_fkey";

-- DropIndex
DROP INDEX "Class_courseId_academicYear_semesterType_section_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "academicYear",
DROP COLUMN "semesterType",
ALTER COLUMN "academicSemesterId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Class_courseId_academicSemesterId_section_key" ON "Class"("courseId", "academicSemesterId", "section");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
