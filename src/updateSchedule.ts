import { getSheetsForDoc } from "./lib/sheets";
import {
  getGreenStatus,
  getNextMonthTitle,
  reorderByGreenStatus,
} from "./lib/utils";
import { Person, UpdateArgs } from "./sharedTypes";

export async function updateSchedule({ credentialsPath, sheetId }: UpdateArgs) {
  const [previousMonthSheet, newMonthSheet] = await getSheetsForDoc(
    sheetId,
    credentialsPath
  );

  // get previous month rows
  const previousRows = await previousMonthSheet.getRows({
    offset: 0,
    limit: previousMonthSheet.rowCount,
  });

  // get months (removing the top month that we just finished)
  const months = previousRows.map((row) => row.Month).slice(1);

  // add current month to end of month list
  const previousFinalMonth = months[months.length - 1];
  months.push(getNextMonthTitle(previousFinalMonth));

  // get people (MCs)
  const people = previousRows.map<Person>((row, i) => {
    const cell = previousMonthSheet.getCell(row.rowIndex - 1, 1);
    return {
      name: row.MC,
      greened: getGreenStatus(cell),
      index: i,
    };
  });

  // reorder MCs based on greened status
  const reorderedMcs = reorderByGreenStatus(people, months.length - 1);

  // make new rows
  const newRows = months.map((month, i) => ({
    Month: month,
    MC: reorderedMcs[i],
  }));

  // add new rows to new sheet
  newMonthSheet.addRows(newRows);

  // TODO: add in placeholders for the movie title cells
  // TODO: add formatting for all cells

  await newMonthSheet.saveUpdatedCells();

  console.log("Update complete!");
}
