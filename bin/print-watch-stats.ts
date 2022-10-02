import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { getWatchStats } from "../src/getWatchStats";
import ObjectsToCsv from "objects-to-csv";

type CLIArgs = {
  credsPath?: string;
  sheetId: string;
  months?: number;
  output?: string;
};

const argv = yargs(hideBin(process.argv)).argv as unknown as CLIArgs;

if (!argv.sheetId) {
  console.error("sheetId is a required parameter");
  process.exit();
}

print();

export async function print() {
  const d = new Date();
  const output = argv.output || `./reports/stats-${d.toISOString()}.csv`

  const stats = await getWatchStats({
    sheetId: argv.sheetId,
    months: argv.months
  });

  const csv = new ObjectsToCsv(stats);
  await csv.toDisk(output);

  console.log("Finished printing stats");
}
