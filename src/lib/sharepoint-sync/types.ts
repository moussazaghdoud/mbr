export interface SharePointFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  eTag: string | null;
  downloadUrl?: string;
}

export interface ParsedSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface ParsedFile {
  fileName: string;
  filePath: string;
  sheets: ParsedSheet[];
  errors: string[];
}

export interface TransformResult {
  kpiId: string;
  field: string;
  value: string | number;
  sourceFile: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface SyncProgress {
  status: "idle" | "running" | "completed" | "failed";
  currentFile?: string;
  totalFiles: number;
  filesProcessed: number;
  rowsImported: number;
  rowsUpdated: number;
  rowsRejected: number;
  errors: string[];
}

export interface SyncConfigInput {
  siteUrl: string;
  driveId: string;
  folderPath: string;
  filePattern: string;
  pollingIntervalMin: number;
  enabled: boolean;
}

export interface ColumnMappingInput {
  excelColumn: string;
  kpiId: string;
  kpiField: string;
  transform: string;
  defaultValue?: string;
  required: boolean;
}
