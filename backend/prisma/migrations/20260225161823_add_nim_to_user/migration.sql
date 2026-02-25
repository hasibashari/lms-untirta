/*
  Warnings:

  - A unique constraint covering the columns `[nim]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nim" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nim_key" ON "User"("nim");
