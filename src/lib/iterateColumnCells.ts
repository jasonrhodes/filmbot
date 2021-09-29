import {
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { COLUMN_LETTERS } from "../constants";

export type CellIterator = (
  prevCell: GoogleSpreadsheetCell,
  newCell: GoogleSpreadsheetCell,
  i: number
) => void;

export async function iterateColumnCells(
  column: number,
  previousMonth: GoogleSpreadsheetWorksheet,
  newMonth: GoogleSpreadsheetWorksheet,
  callback: CellIterator,
  finalCallback: CellIterator = () => null
) {
  const columnLetter = COLUMN_LETTERS[column];
  console.log(`Iterating over cells from column ${columnLetter}`);
  let i;
  for (i = 2; i < previousMonth.rowCount; i++) {
    const prevCell = previousMonth.getCell(i, column);
    const newCell = newMonth.getCell(i - 1, column);

    if (prevCell.formattedValue === null) {
      console.log(
        `Finished iterating ${i - 2} cells from column ${columnLetter}`
      );

      finalCallback(prevCell, newCell, i);
      break;
    }

    callback(prevCell, newCell, i);
  }
}
