-- AlterEnum
ALTER TYPE "KrsStatus" ADD VALUE 'AUTO_APPROVED';

-- AlterTable
ALTER TABLE "AcademicSemester" ADD COLUMN     "krsApprovalDeadlineDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "krsAutoApprovalEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "KrsEnrollment" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "advisorId" TEXT,
ADD COLUMN     "isDospem" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KrsApprovalLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "fromStatus" "KrsStatus" NOT NULL,
    "toStatus" "KrsStatus" NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KrsApprovalLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KrsApprovalLog" ADD CONSTRAINT "KrsApprovalLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "KrsEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
