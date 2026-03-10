-- CreateTable
CREATE TABLE "SyncConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "siteUrl" TEXT NOT NULL DEFAULT '',
    "driveId" TEXT NOT NULL DEFAULT '',
    "folderPath" TEXT NOT NULL DEFAULT '/',
    "filePattern" TEXT NOT NULL DEFAULT '*.xlsx',
    "pollingIntervalMin" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" DATETIME,
    "connectionStatus" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "filesFailed" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "rowsUpdated" INTEGER NOT NULL DEFAULT 0,
    "rowsRejected" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual'
);

-- CreateTable
CREATE TABLE "SyncFileLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "syncJobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "lastModified" DATETIME,
    "eTag" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rowsFound" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "rowsRejected" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "processingMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncFileLog_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "SyncJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ColumnMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileName" TEXT NOT NULL DEFAULT 'default',
    "excelColumn" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "kpiField" TEXT NOT NULL DEFAULT 'value',
    "transform" TEXT NOT NULL DEFAULT 'none',
    "defaultValue" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "FileSyncCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "eTag" TEXT,
    "lastModified" DATETIME,
    "checksum" TEXT,
    "lastSyncedAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncedKPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "period" TEXT NOT NULL DEFAULT '',
    "target" TEXT,
    "targetUnit" TEXT,
    "variance" TEXT,
    "varianceDirection" TEXT,
    "gap" TEXT,
    "sourceFile" TEXT,
    "sourceSheet" TEXT,
    "sourceRow" INTEGER,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FileSyncCache_filePath_key" ON "FileSyncCache"("filePath");
