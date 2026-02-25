-- CreateTable
CREATE TABLE "SemesterStatusLog" (
    "id" TEXT NOT NULL,
    "academicSemesterId" TEXT NOT NULL,
    "fromStatus" "SemesterStatus" NOT NULL,
    "toStatus" "SemesterStatus" NOT NULL,
    "direction" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SemesterStatusLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SemesterStatusLog" ADD CONSTRAINT "SemesterStatusLog_academicSemesterId_fkey" FOREIGN KEY ("academicSemesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterStatusLog" ADD CONSTRAINT "SemesterStatusLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
