-- CreateIndex
CREATE INDEX "Assignment_courseId_idx" ON "Assignment"("courseId");

-- CreateIndex
CREATE INDEX "Class_lecturerId_idx" ON "Class"("lecturerId");

-- CreateIndex
CREATE INDEX "Class_courseId_idx" ON "Class"("courseId");

-- CreateIndex
CREATE INDEX "Class_academicSemesterId_idx" ON "Class"("academicSemesterId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "FinalGrade_studentId_idx" ON "FinalGrade"("studentId");

-- CreateIndex
CREATE INDEX "FinalGrade_classId_idx" ON "FinalGrade"("classId");

-- CreateIndex
CREATE INDEX "FinalGrade_academicSemesterId_idx" ON "FinalGrade"("academicSemesterId");

-- CreateIndex
CREATE INDEX "FinalGrade_lecturerId_idx" ON "FinalGrade"("lecturerId");

-- CreateIndex
CREATE INDEX "ForumReply_threadId_idx" ON "ForumReply"("threadId");

-- CreateIndex
CREATE INDEX "ForumReply_authorId_idx" ON "ForumReply"("authorId");

-- CreateIndex
CREATE INDEX "ForumThread_courseId_idx" ON "ForumThread"("courseId");

-- CreateIndex
CREATE INDEX "ForumThread_authorId_idx" ON "ForumThread"("authorId");

-- CreateIndex
CREATE INDEX "KrsEnrollment_studentId_idx" ON "KrsEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "KrsEnrollment_classId_idx" ON "KrsEnrollment"("classId");

-- CreateIndex
CREATE INDEX "KrsEnrollment_status_idx" ON "KrsEnrollment"("status");

-- CreateIndex
CREATE INDEX "Material_courseId_idx" ON "Material"("courseId");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "Submission"("studentId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_advisorId_idx" ON "User"("advisorId");
