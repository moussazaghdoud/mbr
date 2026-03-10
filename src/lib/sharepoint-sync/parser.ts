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

    // Find the header row: the row with the MOST populated cells
    // This skips title rows that span a single merged cell
    let headerRowIndex = 0;
    let maxCellCount = 0;

    worksheet.eachRow((row, rowNumber) => {
      let cellCount = 0;
      row.eachCell(() => { cellCount++; });
      if (cellCount > maxCellCount) {
        maxCellCount = cellCount;
        headerRowIndex = rowNumber;
      }
    });

    if (headerRowIndex === 0 || maxCellCount <= 0) {
      return { sheetName, headers, rows };
    }

    // Extract headers from the identified row
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.eachCell((cell, colNumber) => {
      const value = this.getCellValue(cell);
      headers[colNumber - 1] = String(value || `Column_${colNumber}`).trim();
    });

    // Collect rows ABOVE the header as "title" rows (store as metadata)
    const titleParts: string[] = [];
    for (let r = 1; r < headerRowIndex; r++) {
      const row = worksheet.getRow(r);
      const cells: string[] = [];
      row.eachCell((cell) => {
        const val = this.getCellValue(cell);
        if (val !== null && val !== undefined && String(val).trim() !== "") {
          cells.push(String(val).trim());
        }
      });
      if (cells.length > 0) {
        titleParts.push(cells.join(" "));
      }
    }

    // Extract data rows (everything after the header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const rowData: Record<string, unknown> = {};
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

    // If we found title rows, inject them as a __title metadata in the first row
    if (titleParts.length > 0 && rows.length > 0) {
      rows[0].__title = titleParts.join(" | ");
    }

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
