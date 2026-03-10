-- CreateTable
CREATE TABLE "UploadedSheet" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "headers" TEXT NOT NULL,
    "rows" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadedSheet_fileName_sheetName_key" ON "UploadedSheet"("fileName", "sheetName");
