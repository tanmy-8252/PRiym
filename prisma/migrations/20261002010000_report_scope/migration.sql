-- AlterTable
ALTER TABLE "ReportJob" ADD COLUMN     "ownerRole" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scopeDepartmentId" TEXT NOT NULL DEFAULT '';

