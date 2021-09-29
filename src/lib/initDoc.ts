import {
  GoogleSpreadsheet,
  ServiceAccountCredentials,
} from "google-spreadsheet";

export async function initDoc(id: string, creds: ServiceAccountCredentials) {
  // Initialize the spreadsheet document - doc ID is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(id);
  await doc.useServiceAccountAuth(creds);

  await doc.loadInfo(); // loads document properties and worksheets
  console.log("Working with Spreadsheet document", doc.title, "...");

  return doc;
}
