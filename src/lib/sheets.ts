import { GoogleSpreadsheet } from "google-spreadsheet";
import { MOVIE_PICKS_RANGE, SCHEDULE_RANGE } from "../constants";
import { formatHeader, getDateTitle } from "./utils";

export async function getSheets(doc: GoogleSpreadsheet) {
  const currentMonthTitle = getDateTitle(new Date());
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthTitle = getDateTitle(previousMonth);
  const previousMonthSheet = await loadSheetByTitle(doc, previousMonthTitle);
  const newMonthSheet = await loadNewSheet(doc, currentMonthTitle);

  return [previousMonthSheet, newMonthSheet];
}

export async function loadSheetByTitle(doc: GoogleSpreadsheet, title: string) {
  const sheet = doc.sheetsByTitle[title];

  console.log(`Evaluating ${sheet.title} ...`);
  console.log(
    "Loading cell ranges",
    [SCHEDULE_RANGE, MOVIE_PICKS_RANGE],
    "..."
  );

  await sheet.loadCells([SCHEDULE_RANGE, MOVIE_PICKS_RANGE]);
  return sheet;
}

export async function loadNewSheet(doc: GoogleSpreadsheet, title: string) {
  const newSheetAlreadyExists = doc.sheetsByTitle[title];
  const newMonthSheet = newSheetAlreadyExists
    ? newSheetAlreadyExists
    : await doc.addSheet({
        title,
        index: 0,
        headerValues: ["Month", "MC"],
      });

  // resize first 4 columns appropriately
  await newMonthSheet.updateDimensionProperties(
    "COLUMNS",
    {
      pixelSize: 200,
      hiddenByFilter: false,
      hiddenByUser: false,
      developerMetadata: [],
    },
    { startIndex: 0, endIndex: 4 }
  );

  // resize first column 5 (film names) appropriately
  await newMonthSheet.updateDimensionProperties(
    "COLUMNS",
    {
      pixelSize: 400,
      hiddenByFilter: false,
      hiddenByUser: false,
      developerMetadata: [],
    },
    { startIndex: 4, endIndex: 5 }
  );

  await newMonthSheet.loadCells([SCHEDULE_RANGE, MOVIE_PICKS_RANGE]);

  ["A1", "B1"].forEach((address) => formatHeader(newMonthSheet, address));

  return newMonthSheet;
}
