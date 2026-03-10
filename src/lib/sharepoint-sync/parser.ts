import ExcelJS from "exceljs";
import type { ParsedFile, ParsedSheet } from "./types";

export class ExcelParser {
  async parse(buffer: Buffer | Uint8Array, fileName: string, filePath: string): Promise<ParsedFile> {
    const errors: string[] = [];
    const sheets: ParsedSheet[] = [];

    try {
      const workbook = new ExcelJS.Workbook();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);

      for (const worksheet of workbook.worksheets) {
        try {
          const parsed = this.parseSheet(worksheet);
          if (parsed.rows.length > 0) {
            sheets.push(parsed);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`Sheet "${worksheet.name}": ${msg}`);
        }
      }

      if (sheets.length === 0 && errors.length === 0) {
        errors.push("No data found in any worksheet");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Failed to parse Excel file: ${msg}`);
    }

    return { fileName, filePath, sheets, errors };
  }

  private parseSheet(worksheet: ExcelJS.Worksheet): ParsedSheet {
    const sheetName = worksheet.name;
    const headers: string[] = [];
    const rows: Record<string, unknown>[] = [];

    // Find header row (first row with data)
    let headerRowIndex = 0;
    worksheet.eachRow((row, rowNumber) => {
      if (headerRowIndex === 0) {
        headerRowIndex = rowNumber;
      }
    });

    if (headerRowIndex === 0) {
      return { sheetName, headers, rows };
    }

    // Extract headers
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.eachCell((cell, colNumber) => {
      const value = this.getCellValue(cell);
      headers[colNumber - 1] = String(value || `Column_${colNumber}`).trim();
    });

    // Extract data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const rowData: Record<string, unknown> = { __rowNumber: rowNumber };
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (!header) return;

        const value = this.getCellValue(cell);
        if (value !== null && value !== undefined && value !== "") {
          hasData = true;
        }
        rowData[header] = value;
      });

      if (hasData) {
        rows.push(rowData);
      }
    });

    return { sheetName, headers: headers.filter(Boolean), rows };
  }

  private getCellValue(cell: ExcelJS.Cell): unknown {
    if (cell.value === null || cell.value === undefined) return null;

    // Handle formula results
    if (typeof cell.value === "object" && "result" in cell.value) {
      return (cell.value as { result: unknown }).result;
    }

    // Handle rich text
    if (typeof cell.value === "object" && "richText" in cell.value) {
      const rt = cell.value as { richText: { text: string }[] };
      return rt.richText.map((r) => r.text).join("");
    }

    // Handle dates
    if (cell.value instanceof Date) {
      return cell.value.toISOString();
    }

    return cell.value;
  }
}
