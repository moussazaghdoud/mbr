/*
  Warnings:

  - You are about to drop the column `authMode` on the `SyncConfig` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `SyncConfig` table. All the data in the column will be lost.
  - You are about to drop the column `clientSecret` on the `SyncConfig` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `SyncConfig` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SyncConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "siteUrl" TEXT NOT NULL DEFAULT '',
    "driveId" TEXT NOT NULL DEFAULT '',
    "folderPath" TEXT NOT NULL DEFAULT '/',
    "filePattern" TEXT NOT NULL DEFAULT '*.xlsx',
    "pollingIntervalMin" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" DATETIME,
    "connectionStatus" TEXT NOT NULL DEFAULT 'unknown',
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SyncConfig" ("connectionStatus", "createdAt", "driveId", "enabled", "filePattern", "folderPath", "id", "lastTestedAt", "password", "pollingIntervalMin", "siteUrl", "updatedAt", "username") SELECT "connectionStatus", "createdAt", "driveId", "enabled", "filePattern", "folderPath", "id", "lastTestedAt", "password", "pollingIntervalMin", "siteUrl", "updatedAt", "username" FROM "SyncConfig";
DROP TABLE "SyncConfig";
ALTER TABLE "new_SyncConfig" RENAME TO "SyncConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
