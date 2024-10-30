/*
  Warnings:

  - The `content` column on the `Lecture` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `type` to the `Lecture` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "content",
ADD COLUMN     "content" TEXT[];
