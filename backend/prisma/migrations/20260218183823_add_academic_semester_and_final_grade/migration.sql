-- CreateEnum
CREATE TYPE "SemesterStatus" AS ENUM ('PLANNING', 'ENROLLMENT', 'ONGOING', 'GRADING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "academicSemesterId" TEXT;

-- CreateTable
CREATE TABLE "AcademicSemester" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semesterType" "SemesterType" NOT NULL,
    "status" "SemesterStatus" NOT NULL DEFAULT 'PLANNING',
    "enrollmentStart" TIMESTAMP(3),
    "enrollmentEnd" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "gradingDeadline" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalGrade" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "numericScore" DOUBLE PRECISION,
    "status" "GradeStatus" NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSemester_academicYear_semesterType_key" ON "AcademicSemester"("academicYear", "semesterType");

-- CreateIndex
CREATE UNIQUE INDEX "FinalGrade_studentId_classId_key" ON "FinalGrade"("studentId", "classId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
