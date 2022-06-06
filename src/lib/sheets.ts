import {
  GoogleSpreadsheet,
  ServiceAccountCredentials,
} from "google-spreadsheet";
import { MOVIE_PICKS_RANGE, SCHEDULE_RANGE } from "../constants";
import { formatHeader, getDateTitle } from "./utils";

const JSON_CREDS_PATH = process.env.FILMBOT_JSON_CREDS_PATH || process.cwd() + "/SECRETS/google-credentials.json";

// export interface ServiceAccountCredentials {
//     /**
//      * @description
//      * service account email address
//      */
//     client_email: string;

//     /**
//      * @description
//      * service account private key
//      */
//     private_key: string;
// }

function checkIfServiceAccountCredentials(
  creds: any
): creds is ServiceAccountCredentials {
  return (
    creds &&
    typeof creds.client_email === "string" &&
    typeof creds.private_key === "string"
  );
}

function getCredentials(
  credentialsPath: string = JSON_CREDS_PATH
) {
  let creds;
  try {
    creds = require(credentialsPath);
  } catch (e) {
    throw new Error(
      `Could not require in credentials from ${credentialsPath}, could be invalid format (must be valid JSON with client_email and private_key string values) : ${e.message}`
    );
  }
  if (checkIfServiceAccountCredentials(creds)) {
    return creds;
  }
  throw new Error(
    `Passed in credentials file path does not contain the required keys of "client_email" and "private_key"`
  );
}

export async function initDoc(id: string, credentialsPath?: string) {
  // Initialize the spreadsheet document - doc ID is the long id in the sheets URL
  const creds = getCredentials(credentialsPath);
  const doc = new GoogleSpreadsheet(id);

  await doc.useServiceAccountAuth(creds);

  await doc.loadInfo(); // loads document properties and worksheets
  console.log("Working with Spreadsheet document", doc.title, "...");

  return doc;
}

interface GetSheetOptionsBase {
  index?: number;
}
interface GetSheetOptionsByID extends GetSheetOptionsBase {
  id: string;
  credentialsPath?: string;
  cachedDoc?: never;
}

interface GetSheetOptionsByCache extends GetSheetOptionsBase {
  id?: string;
  credentialsPath?: string;
  cachedDoc: GoogleSpreadsheet;
}

export type GetSheetOptions = GetSheetOptionsByID | GetSheetOptionsByCache;

export async function getSheetFromDoc({
  id,
  index = 0,
  credentialsPath,
  cachedDoc
}: GetSheetOptions) {
  const doc = cachedDoc ? cachedDoc : await initDoc(id, credentialsPath);
  const sheet = doc.sheetsByIndex[index];
  if (!sheet) {
    return null;
  }
  console.log(`Loading sheet cells for ${sheet.title}`);
  await sheet.loadCells([SCHEDULE_RANGE, MOVIE_PICKS_RANGE]);
  return sheet;
}

export async function getSheetsToUpdateForDoc({
  id,
  credentialsPath,
  dryRun = false,
}: {
  id: string;
  credentialsPath?: string;
  dryRun?: boolean;
}) {
  const doc = await initDoc(id, credentialsPath);
  return await getSheets(doc, dryRun);
}

export async function getSheets(doc: GoogleSpreadsheet, dryRun?: boolean) {
  const currentMonthTitle = getDateTitle(new Date());
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthTitle = getDateTitle(previousMonth);
  const previousMonthSheet = await loadSheetByTitle(doc, previousMonthTitle);

  if (dryRun) {
    return [previousMonthSheet];
  }

  const newMonthSheet = await loadNewSheet(doc, currentMonthTitle);

  return [previousMonthSheet, newMonthSheet];
}

export async function loadSheetByTitle(doc: GoogleSpreadsheet, title: string) {
  const sheet = doc.sheetsByTitle[title];

  console.log(`Evaluating ${sheet.title} ...`);
  // console.log(
  //   "Loading cell ranges",
  //   [SCHEDULE_RANGE, MOVIE_PICKS_RANGE],
  //   "..."
  // );

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
