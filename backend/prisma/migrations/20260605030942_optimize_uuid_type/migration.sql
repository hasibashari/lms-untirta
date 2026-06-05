/*
  Warnings:

  - The primary key for the `AcademicSemester` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Assignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `classId` column on the `Assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Class` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `FinalGrade` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ForumReply` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `parentId` column on the `ForumReply` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ForumThread` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `KrsApprovalLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `actorId` column on the `KrsApprovalLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `KrsEnrollment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `approvedBy` column on the `KrsEnrollment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Material` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `classId` column on the `Material` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Submission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `advisorId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `id` on the `AcademicSemester` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Assignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `Assignment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Class` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `Class` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lecturerId` on the `Class` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `academicSemesterId` on the `Class` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `teacherId` on the `Course` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `FinalGrade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `studentId` on the `FinalGrade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `classId` on the `FinalGrade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `academicSemesterId` on the `FinalGrade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lecturerId` on the `FinalGrade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ForumReply` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `threadId` on the `ForumReply` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `authorId` on the `ForumReply` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `ForumThread` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `ForumThread` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `authorId` on the `ForumThread` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `KrsApprovalLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `enrollmentId` on the `KrsApprovalLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `KrsEnrollment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `studentId` on the `KrsEnrollment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `classId` on the `KrsEnrollment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Material` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `Material` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `assignmentId` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `studentId` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_classId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_academicSemesterId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_lecturerId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "FinalGrade" DROP CONSTRAINT "FinalGrade_academicSemesterId_fkey";

-- DropForeignKey
ALTER TABLE "FinalGrade" DROP CONSTRAINT "FinalGrade_classId_fkey";

-- DropForeignKey
ALTER TABLE "FinalGrade" DROP CONSTRAINT "FinalGrade_lecturerId_fkey";

-- DropForeignKey
ALTER TABLE "FinalGrade" DROP CONSTRAINT "FinalGrade_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_threadId_fkey";

-- DropForeignKey
ALTER TABLE "ForumThread" DROP CONSTRAINT "ForumThread_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ForumThread" DROP CONSTRAINT "ForumThread_courseId_fkey";

-- DropForeignKey
ALTER TABLE "KrsApprovalLog" DROP CONSTRAINT "KrsApprovalLog_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "KrsEnrollment" DROP CONSTRAINT "KrsEnrollment_classId_fkey";

-- DropForeignKey
ALTER TABLE "KrsEnrollment" DROP CONSTRAINT "KrsEnrollment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_classId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_studentId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_advisorId_fkey";

-- AlterTable
ALTER TABLE "AcademicSemester" DROP CONSTRAINT "AcademicSemester_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ADD CONSTRAINT "AcademicSemester_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "courseId" TYPE UUID USING "courseId"::uuid,
ALTER COLUMN "classId" TYPE UUID USING "classId"::uuid,
ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Class" DROP CONSTRAINT "Class_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "courseId" TYPE UUID USING "courseId"::uuid,
ALTER COLUMN "lecturerId" TYPE UUID USING "lecturerId"::uuid,
ALTER COLUMN "academicSemesterId" TYPE UUID USING "academicSemesterId"::uuid,
ADD CONSTRAINT "Class_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "teacherId" TYPE UUID USING "teacherId"::uuid,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FinalGrade" DROP CONSTRAINT "FinalGrade_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "studentId" TYPE UUID USING "studentId"::uuid,
ALTER COLUMN "classId" TYPE UUID USING "classId"::uuid,
ALTER COLUMN "academicSemesterId" TYPE UUID USING "academicSemesterId"::uuid,
ALTER COLUMN "lecturerId" TYPE UUID USING "lecturerId"::uuid,
ADD CONSTRAINT "FinalGrade_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ForumReply" DROP CONSTRAINT "ForumReply_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "threadId" TYPE UUID USING "threadId"::uuid,
ALTER COLUMN "authorId" TYPE UUID USING "authorId"::uuid,
ALTER COLUMN "parentId" TYPE UUID USING "parentId"::uuid,
ADD CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ForumThread" DROP CONSTRAINT "ForumThread_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "courseId" TYPE UUID USING "courseId"::uuid,
ALTER COLUMN "authorId" TYPE UUID USING "authorId"::uuid,
ADD CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "KrsApprovalLog" DROP CONSTRAINT "KrsApprovalLog_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "enrollmentId" TYPE UUID USING "enrollmentId"::uuid,
ALTER COLUMN "actorId" TYPE UUID USING "actorId"::uuid,
ADD CONSTRAINT "KrsApprovalLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "KrsEnrollment" DROP CONSTRAINT "KrsEnrollment_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "studentId" TYPE UUID USING "studentId"::uuid,
ALTER COLUMN "classId" TYPE UUID USING "classId"::uuid,
ALTER COLUMN "approvedBy" TYPE UUID USING "approvedBy"::uuid,
ADD CONSTRAINT "KrsEnrollment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Material" DROP CONSTRAINT "Material_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "courseId" TYPE UUID USING "courseId"::uuid,
ALTER COLUMN "classId" TYPE UUID USING "classId"::uuid,
ADD CONSTRAINT "Material_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "assignmentId" TYPE UUID USING "assignmentId"::uuid,
ALTER COLUMN "studentId" TYPE UUID USING "studentId"::uuid,
ADD CONSTRAINT "Submission_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" TYPE UUID USING "id"::uuid,
ALTER COLUMN "advisorId" TYPE UUID USING "advisorId"::uuid,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");


























-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrsEnrollment" ADD CONSTRAINT "KrsEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrsEnrollment" ADD CONSTRAINT "KrsEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrsApprovalLog" ADD CONSTRAINT "KrsApprovalLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "KrsEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReply" ADD CONSTRAINT "ForumReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
