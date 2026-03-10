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
    "authMode" TEXT NOT NULL DEFAULT 'ropc',
    "tenantId" TEXT NOT NULL DEFAULT '',
    "clientId" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "clientSecret" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SyncConfig" ("connectionStatus", "createdAt", "driveId", "enabled", "filePattern", "folderPath", "id", "lastTestedAt", "pollingIntervalMin", "siteUrl", "updatedAt") SELECT "connectionStatus", "createdAt", "driveId", "enabled", "filePattern", "folderPath", "id", "lastTestedAt", "pollingIntervalMin", "siteUrl", "updatedAt" FROM "SyncConfig";
DROP TABLE "SyncConfig";
ALTER TABLE "new_SyncConfig" RENAME TO "SyncConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
