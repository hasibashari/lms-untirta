-- Simplify KRS status: DRAFT/SUBMITTED/APPROVED/REJECTED → PENDING/APPROVED/REJECTED
-- DRAFT and SUBMITTED are merged into PENDING

-- Step 1: Drop the default that references the old enum so we can drop it later
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" DROP DEFAULT;

-- Step 2: Cast columns to text to detach from the old enum
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "fromStatus" TYPE TEXT USING "fromStatus"::TEXT;
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "toStatus" TYPE TEXT USING "toStatus"::TEXT;

-- Step 3: Migrate data — DRAFT and SUBMITTED become PENDING
UPDATE "KrsEnrollment" SET "status" = 'PENDING' WHERE "status" IN ('DRAFT', 'SUBMITTED');
UPDATE "KrsApprovalLog" SET "fromStatus" = 'PENDING' WHERE "fromStatus" IN ('DRAFT', 'SUBMITTED');
UPDATE "KrsApprovalLog" SET "toStatus" = 'PENDING' WHERE "toStatus" IN ('DRAFT', 'SUBMITTED');

-- Step 4: Set submittedAt for records that were DRAFT (didn't have submittedAt)
UPDATE "KrsEnrollment" SET "submittedAt" = "createdAt" WHERE "status" = 'PENDING' AND "submittedAt" IS NULL;

-- Step 5: Drop old enum and create new one
DROP TYPE "KrsStatus";
CREATE TYPE "KrsStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Step 6: Cast columns back to the new enum
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" TYPE "KrsStatus" USING "status"::"KrsStatus";
ALTER TABLE "KrsEnrollment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "fromStatus" TYPE "KrsStatus" USING "fromStatus"::"KrsStatus";
ALTER TABLE "KrsApprovalLog" ALTER COLUMN "toStatus" TYPE "KrsStatus" USING "toStatus"::"KrsStatus";
