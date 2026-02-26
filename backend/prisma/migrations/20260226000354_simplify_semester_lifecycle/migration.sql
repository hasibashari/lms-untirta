/*
  Simplify semester lifecycle: PLANNING/ENROLLMENT/ONGOING/GRADING/COMPLETED → DRAFT/OPEN/CLOSED
  Remove auto-approval feature: AUTO_APPROVED KRS status, CronJobLog table, related columns
*/

-- =============================================
-- 1. KRS Status: Remove AUTO_APPROVED
-- =============================================

-- Convert columns to text to allow data migration
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" TYPE text;
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "fromStatus" TYPE text;
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "toStatus" TYPE text;

-- Map AUTO_APPROVED → APPROVED
UPDATE "KrsEnrollment" SET "status" = 'APPROVED' WHERE "status" = 'AUTO_APPROVED';
UPDATE "KrsApprovalLog" SET "fromStatus" = 'APPROVED' WHERE "fromStatus" = 'AUTO_APPROVED';
UPDATE "KrsApprovalLog" SET "toStatus" = 'APPROVED' WHERE "toStatus" = 'AUTO_APPROVED';

-- Recreate enum and cast back
DROP TYPE "KrsStatus";
CREATE TYPE "KrsStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" TYPE "KrsStatus" USING "status"::"KrsStatus";
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "fromStatus" TYPE "KrsStatus" USING "fromStatus"::"KrsStatus";
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "toStatus" TYPE "KrsStatus" USING "toStatus"::"KrsStatus";
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- =============================================
-- 2. Semester Status: Simplify to DRAFT/OPEN/CLOSED
-- =============================================

-- Convert columns to text
ALTER TABLE "AcademicSemester" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AcademicSemester" ALTER COLUMN "status" TYPE text;
ALTER TABLE "SemesterStatusLog" ALTER COLUMN "fromStatus" TYPE text;
ALTER TABLE "SemesterStatusLog" ALTER COLUMN "toStatus" TYPE text;

-- Map old statuses to new: PLANNING→DRAFT, ENROLLMENT/ONGOING/GRADING→OPEN, COMPLETED→CLOSED
UPDATE "AcademicSemester" SET "status" = 'DRAFT' WHERE "status" = 'PLANNING';
UPDATE "AcademicSemester" SET "status" = 'OPEN' WHERE "status" IN ('ENROLLMENT', 'ONGOING', 'GRADING');
UPDATE "AcademicSemester" SET "status" = 'CLOSED' WHERE "status" = 'COMPLETED';

UPDATE "SemesterStatusLog" SET "fromStatus" = 'DRAFT' WHERE "fromStatus" = 'PLANNING';
UPDATE "SemesterStatusLog" SET "fromStatus" = 'OPEN' WHERE "fromStatus" IN ('ENROLLMENT', 'ONGOING', 'GRADING');
UPDATE "SemesterStatusLog" SET "fromStatus" = 'CLOSED' WHERE "fromStatus" = 'COMPLETED';
UPDATE "SemesterStatusLog" SET "toStatus" = 'DRAFT' WHERE "toStatus" = 'PLANNING';
UPDATE "SemesterStatusLog" SET "toStatus" = 'OPEN' WHERE "toStatus" IN ('ENROLLMENT', 'ONGOING', 'GRADING');
UPDATE "SemesterStatusLog" SET "toStatus" = 'CLOSED' WHERE "toStatus" = 'COMPLETED';

-- Recreate enum and cast back
DROP TYPE "SemesterStatus";
CREATE TYPE "SemesterStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
ALTER TABLE "AcademicSemester" ALTER COLUMN "status" TYPE "SemesterStatus" USING "status"::"SemesterStatus";
ALTER TABLE "SemesterStatusLog" ALTER COLUMN "fromStatus" TYPE "SemesterStatus" USING "fromStatus"::"SemesterStatus";
ALTER TABLE "SemesterStatusLog" ALTER COLUMN "toStatus" TYPE "SemesterStatus" USING "toStatus"::"SemesterStatus";
ALTER TABLE "AcademicSemester" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- =============================================
-- 3. Drop removed columns and tables
-- =============================================

ALTER TABLE "CronJobLog" DROP CONSTRAINT "CronJobLog_academicSemesterId_fkey";

ALTER TABLE "AcademicSemester" DROP COLUMN "enrollmentEnd",
DROP COLUMN "enrollmentStart",
DROP COLUMN "gradingDeadline",
DROP COLUMN "krsApprovalDeadlineDays",
DROP COLUMN "krsAutoApprovalEnabled";

DROP TABLE "CronJobLog";
DROP TYPE "CronJobStatus";
