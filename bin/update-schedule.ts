import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { updateSchedule } from "../src/updateSchedule";

type CLIArgs = {
  credsPath?: string;
  sheetId: string;
  dryRun?: boolean;
  cacheStats?: boolean;
  useStatsCache?: string;
};

const argv = yargs(hideBin(process.argv)).argv as unknown as CLIArgs;
const sheetId = process.env.GOOGLE_SHEET_ID ? process.env.GOOGLE_SHEET_ID : argv.sheetId;

if (!sheetId) {
  console.error("sheetId is a required parameter");
  process.exit();
}

updateSchedule({
  sheetId,
  opts: {
    dryRun: !!argv.dryRun,
    cacheStats: !!argv.cacheStats,
    useStatsCache: argv.useStatsCache
  }
});
