/*
  Warnings:

  - Made the column `thumbnail` on table `Space` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Space" ALTER COLUMN "thumbnail" SET NOT NULL;
