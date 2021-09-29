import { TextFormat } from "google-spreadsheet";
import { COLORS, FONT_FAMILY } from "./constants";
import { initDoc } from "./lib/initDoc";
import { iterateColumnCells } from "./lib/iterateColumnCells";
import { getSheets } from "./lib/sheets";
import { findAvailableIndex, getDateTitle, isGreen, zebra } from "./lib/utils";

interface UpdateArgs {
  credentialsPath?: string;
  sheetId: string;
}

export async function updateSchedule({
  credentialsPath = process.cwd() + "/SECRETS/google-credentials.json",
  sheetId,
}: UpdateArgs) {
  const creds = require(credentialsPath);
  const doc = await initDoc(sheetId, creds);
  const [previousMonthSheet, newMonthSheet] = await getSheets(doc);
  const mcs: string[] = [];
  const monthTextFormat: TextFormat = { bold: true, fontFamily: FONT_FAMILY };
  const mcTextFormat: TextFormat = { bold: false, fontFamily: FONT_FAMILY };

  // add all the months to the new sheet
  await iterateColumnCells(
    0,
    previousMonthSheet,
    newMonthSheet,
    (prevCell, newCell, i) => {
      newCell.textFormat = monthTextFormat;
      newCell.value = prevCell.formattedValue;
      if (i === 2) {
        newCell.backgroundColor = COLORS.YELLOW;
      } else {
        zebra(newCell, i);
      }
      return newCell;
    },
    (prevCell, newCell, i) => {
      const finalMonthCell = previousMonthSheet.getCell(
        prevCell.rowIndex - 1,
        prevCell.columnIndex
      );
      const addedMonth = new Date(finalMonthCell.formattedValue);
      addedMonth.setMonth(addedMonth.getMonth() + 1);
      const addedMonthTitle = getDateTitle(addedMonth);
      newCell.value = addedMonthTitle;
      newCell.textFormat = monthTextFormat;
      zebra(newCell, i);
    }
  );

  // order the MCs in a local array
  await iterateColumnCells(
    1,
    previousMonthSheet,
    newMonthSheet,
    (prevCell, newCell) => {
      if (!isGreen(prevCell.backgroundColor)) {
        mcs[newCell.rowIndex + 1] = prevCell.formattedValue;
      } else {
        const availableIndex = findAvailableIndex(mcs, newCell.rowIndex);
        mcs[availableIndex] = prevCell.formattedValue;
      }
      // make sure previous month's chooser is moved to the bottom as well
    }
  );

  // apply the MCs to the page in the order from the local array
  await iterateColumnCells(
    1,
    previousMonthSheet,
    newMonthSheet,
    (prevCell, newCell, i) => {
      newCell.value = mcs[newCell.rowIndex];
      newCell.textFormat = mcTextFormat;
      if (i === 2) {
        newCell.backgroundColor = COLORS.YELLOW;
        newCell.textFormat = { ...mcTextFormat, bold: true };
      } else if (i === 3) {
        newCell.backgroundColor = COLORS.GREEN;
      } else {
        zebra(newCell, i);
      }
    },
    (prevCell, newCell, i) => {
      const lastPicked = previousMonthSheet.getCellByA1("B2").formattedValue;
      newCell.value = lastPicked;
      newCell.textFormat = mcTextFormat;
      zebra(newCell, i);
    }
  );

  // save all changes
  await newMonthSheet.saveUpdatedCells();
  console.log("Update complete");
}
