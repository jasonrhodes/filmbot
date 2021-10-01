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
  let greened;
  // for some reason, trying to access cell.backgroundColor blows up sometimes as
  // "cannot access backgroundColor of undefined", even when we previously check
  // that cell is in fact defined. Using try/catch for this for now, bad idea.
  try {
    greened = isGreen(cell.backgroundColor);
  } catch (e) {
    // console.log(
    //   `Error while checking green cell color background for ${cell.formattedValue}: ${e.message}`
    // );
    if (e.message !== "Cannot read property 'backgroundColor' of undefined") {
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
  list: any[],
  index: number,
  originalAttempt?: number
): number {
  if (index < 0) {
    throw new Error(
      `No empty spots available when trying to put someone at spot ${originalAttempt}`
    );
  }
  return list[index] === undefined
    ? index
    : findEmptyIndex(list, index - 1, originalAttempt || index);
}

export function reorderByGreenStatus(people: Person[], months: string[]) {
  const reordered = [];

  const previousChooser = people.shift();
  people.forEach((person) => {
    const placement = findEmptyIndex(
      reordered,
      // if they are "greened", they stay at their previous index, otherwise they move "down" one spot
      person.greened ? person.index : person.index + 1
    );
    if (placement === person.index) {
      console.log(`${person.name}: still scheduled for ${months[placement]}`);
    } else if (placement === person.index + 1) {
      console.log(
        `${person.name} FAILED to watch this month and drops back a month to ${months[placement]}`
      );
    } else if (placement < person.index) {
      const diff = person.index - placement;
      console.log(
        `Woot! Due to being behind one or more delinquents, ${person.name} has moved up to ${months[placement]} (a ${diff} month jump!)`
      );
    } else {
      console.log(
        `Uh oh, ${person.name} moved back by more than one spot (${
          placement - person.index
        }), this isn't supposed to happen`
      );
      throw new Error("Reordering error");
    }
    reordered[placement] = person.name;
  });

  // find a spot for the previous chooser (last spot unless those in those spots previously didn't watch)
  const previousChoosePlacement = findEmptyIndex(reordered, people.length - 1);
  reordered[previousChoosePlacement] = previousChooser.name;

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
