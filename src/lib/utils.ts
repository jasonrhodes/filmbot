import {
  Color,
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
  TextFormat,
} from "google-spreadsheet";
import { COLORS, FONT_FAMILY } from "../constants";

export function formatHeader(
  sheet: GoogleSpreadsheetWorksheet,
  cellAddress: string
) {
  formatCell(sheet, cellAddress, {
    fontFamily: FONT_FAMILY,
    bold: true,
    fontSize: 12,
  });
}

export function formatCell(
  sheet: GoogleSpreadsheetWorksheet,
  cellAddress: string,
  format: TextFormat
) {
  const cell = sheet.getCellByA1(cellAddress);
  cell.textFormat = format;
}

export function getDateTitle(date: Date) {
  const year = date.getFullYear();
  const month = date.toLocaleString("en-us", { month: "long" });
  return `${month} ${year}`;
}

export function isGreen(color: Color) {
  return color.green === 1 && !color.red && !color.blue;
}

export function findAvailableIndex(set: string[], index: number): number {
  if (index === 0) {
    throw new Error(
      "Cannot find an available spot for a greened member " +
        JSON.stringify(set)
    );
  }
  if (!set[index]) {
    return index;
  } else {
    return findAvailableIndex(set, index - 1);
  }
}

export function zebra(cell: GoogleSpreadsheetCell, i: number) {
  if (i % 2 === 0) {
    cell.backgroundColor = COLORS.LIGHT_GREY;
  }
}
