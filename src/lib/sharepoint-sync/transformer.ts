import { prisma } from "@/lib/db";
import type { ParsedSheet, TransformResult } from "./types";

interface MappingRule {
  excelColumn: string;
  kpiId: string;
  kpiField: string;
  transform: string;
  defaultValue?: string | null;
  required: boolean;
}

export class DataTransformer {
  private mappings: MappingRule[] = [];

  async loadMappings(profileName = "default"): Promise<void> {
    const dbMappings = await prisma.columnMapping.findMany({
      where: { profileName },
    });
    this.mappings = dbMappings.map((m) => ({
      excelColumn: m.excelColumn,
      kpiId: m.kpiId,
      kpiField: m.kpiField,
      transform: m.transform,
      defaultValue: m.defaultValue,
      required: m.required,
    }));
  }

  transform(sheet: ParsedSheet, sourceFile: string): { results: TransformResult[]; errors: string[] } {
    const results: TransformResult[] = [];
    const errors: string[] = [];

    if (this.mappings.length === 0) {
      // Auto-detect mode: try to map based on common patterns
      return this.autoTransform(sheet, sourceFile);
    }

    for (const row of sheet.rows) {
      const rowNum = (row.__rowNumber as number) || 0;

      for (const mapping of this.mappings) {
        const rawValue = row[mapping.excelColumn];

        if (rawValue === null || rawValue === undefined || rawValue === "") {
          if (mapping.required) {
            errors.push(`Row ${rowNum}: Required column "${mapping.excelColumn}" is empty (KPI: ${mapping.kpiId})`);
          } else if (mapping.defaultValue !== null && mapping.defaultValue !== undefined) {
            results.push({
              kpiId: mapping.kpiId,
              field: mapping.kpiField,
              value: mapping.defaultValue,
              sourceFile,
              sourceSheet: sheet.sheetName,
              sourceRow: rowNum,
            });
          }
          continue;
        }

        try {
          const transformed = this.applyTransform(rawValue, mapping.transform);
          results.push({
            kpiId: mapping.kpiId,
            field: mapping.kpiField,
            value: transformed,
            sourceFile,
            sourceSheet: sheet.sheetName,
            sourceRow: rowNum,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Transform error";
          errors.push(`Row ${rowNum}, column "${mapping.excelColumn}": ${msg}`);
        }
      }
    }

    return { results, errors };
  }

  private autoTransform(sheet: ParsedSheet, sourceFile: string): { results: TransformResult[]; errors: string[] } {
    const results: TransformResult[] = [];
    const errors: string[] = [];

    // Look for columns that match KPI patterns
    // Expected format: rows with KPI ID or Name, and a Value column
    const headers = sheet.headers.map((h) => h.toLowerCase());

    const idCol = headers.findIndex((h) => ["id", "kpi_id", "kpi id", "metric_id", "metric id"].includes(h));
    const nameCol = headers.findIndex((h) => ["name", "kpi_name", "kpi name", "metric", "metric_name"].includes(h));
    const valueCol = headers.findIndex((h) => ["value", "actual", "current", "result", "amount"].includes(h));
    const targetCol = headers.findIndex((h) => ["target", "goal", "objective", "budget"].includes(h));
    const periodCol = headers.findIndex((h) => ["period", "date", "month", "quarter"].includes(h));
    const varianceCol = headers.findIndex((h) => ["variance", "change", "delta", "variation", "yoy"].includes(h));
    const unitCol = headers.findIndex((h) => ["unit", "units", "uom"].includes(h));
    const domainCol = headers.findIndex((h) => ["domain", "category", "area", "department"].includes(h));

    if (idCol === -1 && nameCol === -1) {
      errors.push(`Auto-detect: Could not find ID or Name column in sheet "${sheet.sheetName}". Headers: ${sheet.headers.join(", ")}`);
      return { results, errors };
    }

    for (const row of sheet.rows) {
      const rowNum = (row.__rowNumber as number) || 0;
      const kpiIdentifier = idCol >= 0
        ? String(row[sheet.headers[idCol]] || "")
        : this.slugify(String(row[sheet.headers[nameCol]] || ""));

      if (!kpiIdentifier) continue;

      if (valueCol >= 0) {
        const raw = row[sheet.headers[valueCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          try {
            results.push({
              kpiId: kpiIdentifier,
              field: "value",
              value: this.applyTransform(raw, "auto"),
              sourceFile,
              sourceSheet: sheet.sheetName,
              sourceRow: rowNum,
            });
          } catch (err: unknown) {
            errors.push(`Row ${rowNum}: Failed to transform value "${raw}"`);
          }
        }
      }

      if (targetCol >= 0) {
        const raw = row[sheet.headers[targetCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          try {
            results.push({
              kpiId: kpiIdentifier,
              field: "target",
              value: this.applyTransform(raw, "auto"),
              sourceFile,
              sourceSheet: sheet.sheetName,
              sourceRow: rowNum,
            });
          } catch { /* optional field */ }
        }
      }

      if (varianceCol >= 0) {
        const raw = row[sheet.headers[varianceCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          results.push({
            kpiId: kpiIdentifier,
            field: "variance",
            value: String(raw),
            sourceFile,
            sourceSheet: sheet.sheetName,
            sourceRow: rowNum,
          });
        }
      }

      if (periodCol >= 0) {
        const raw = row[sheet.headers[periodCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          results.push({
            kpiId: kpiIdentifier,
            field: "period",
            value: String(raw),
            sourceFile,
            sourceSheet: sheet.sheetName,
            sourceRow: rowNum,
          });
        }
      }

      if (unitCol >= 0) {
        const raw = row[sheet.headers[unitCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          results.push({
            kpiId: kpiIdentifier,
            field: "unit",
            value: String(raw),
            sourceFile,
            sourceSheet: sheet.sheetName,
            sourceRow: rowNum,
          });
        }
      }

      if (nameCol >= 0) {
        const raw = row[sheet.headers[nameCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          results.push({
            kpiId: kpiIdentifier,
            field: "name",
            value: String(raw),
            sourceFile,
            sourceSheet: sheet.sheetName,
            sourceRow: rowNum,
          });
        }
      }

      if (domainCol >= 0) {
        const raw = row[sheet.headers[domainCol]];
        if (raw !== null && raw !== undefined && raw !== "") {
          results.push({
            kpiId: kpiIdentifier,
            field: "domain",
            value: String(raw).toLowerCase(),
            sourceFile,
            sourceSheet: sheet.sheetName,
            sourceRow: rowNum,
          });
        }
      }
    }

    return { results, errors };
  }

  private applyTransform(value: unknown, transform: string): string | number {
    if (transform === "none") return typeof value === "number" ? value : String(value);

    if (transform === "number" || transform === "auto") {
      if (typeof value === "number") return value;
      const str = String(value).replace(/[,\s]/g, "").replace(/\u00a0/g, "");
      // Handle French decimal format (comma as decimal separator)
      const frenchNum = str.replace(",", ".");
      const num = parseFloat(frenchNum);
      if (!isNaN(num)) return num;
      if (transform === "auto") return String(value);
      throw new Error(`Cannot convert "${value}" to number`);
    }

    if (transform === "percentage") {
      if (typeof value === "number") return value * (value <= 1 ? 100 : 1);
      const str = String(value).replace(/[%\s]/g, "").replace(",", ".");
      const num = parseFloat(str);
      if (!isNaN(num)) return num;
      throw new Error(`Cannot convert "${value}" to percentage`);
    }

    if (transform === "currency") {
      if (typeof value === "number") return value;
      const str = String(value).replace(/[€$£\s,]/g, "").replace(",", ".");
      const num = parseFloat(str);
      if (!isNaN(num)) return num;
      throw new Error(`Cannot convert "${value}" to currency`);
    }

    if (transform === "date") {
      if (value instanceof Date) return value.toISOString().slice(0, 10);
      return String(value);
    }

    return String(value);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
  }
}
