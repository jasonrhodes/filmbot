import {
  Color,
  GoogleSpreadsheetCell,
  GoogleSpreadsheetWorksheet,
  TextFormat,
} from "google-spreadsheet";
import { COLORS, FONT_FAMILY } from "../constants";
import { Person } from "../sharedTypes";

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

export function isGreen(color?: Color) {
  if (!color) return false;
  return color.green === 1 && !color.red && !color.blue;
}

export function getGreenStatus(cell: GoogleSpreadsheetCell) {
  let greened: boolean;
  // for some reason, trying to access cell.backgroundColor blows up sometimes as
  // "cannot access backgroundColor of undefined", even when we previously check
  // that cell is in fact defined. Using try/catch for this for now, bad idea.
  try {
    greened = isGreen(cell.backgroundColor);
  } catch (e) {
    // console.log(
    //   `Error while checking green cell color background for ${cell.formattedValue}: ${e.message}`
    // );
    if (e.message !== "Cannot read property 'backgroundColor' of undefined" && e.message !== "Cannot read properties of undefined (reading 'backgroundColor')") {
      throw e;
    }
    greened = false;
  }
  // first two in list are "auto-greened", the previous chooser and the next chooser to avoid volatility :P
  if (cell.rowIndex === 1 || cell.rowIndex === 2) {
    greened = true;
  }
  return greened;
}

export function findEmptyIndex(
  people: Person[],
  index: number,
  originalAttempt?: number
): number {
  if (index < 0) {
    throw new Error(
      `No empty spots available when trying to put someone at spot ${originalAttempt}`
    );
  }

  // console.log("Looking for an empty index", index, originalAttempt);
  // console.log(JSON.stringify(people, null, 2));
  
  return people[index] === undefined
    ? index
    : findEmptyIndex(people, index - 1, originalAttempt || index);
}

export function reorderByGreenStatus(people: Person[], months: string[]) {
  const reordered = people.reduce<Person[]>((_reordered, person) => {
    // person.previousIndex = person.index;
    person.index = findEmptyIndex(
      _reordered,
      // if they are "greened", they stay at their previous index, otherwise they move "down" one spot
      person.greened ? person.index : person.index + 1
    );
    _reordered[person.index] = person;
    return _reordered;
  }, []);

  return reordered.filter((x) => !!x);
}

export function zebra(cell: GoogleSpreadsheetCell, i: number) {
  if (i % 2 === 0) {
    cell.backgroundColor = COLORS.LIGHT_GREY;
  }
}

export function getNextMonthTitle(month: string | Date) {
  const nextMonth = new Date(month);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return getDateTitle(nextMonth);
}
