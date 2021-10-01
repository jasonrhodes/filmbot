import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { updateSchedule } from "../src/updateSchedule";

type CLIArgs = {
  credsPath?: string;
  sheetId: string;
  dryRun: boolean;
};

const argv = yargs(hideBin(process.argv)).argv as unknown as CLIArgs;

if (!argv.sheetId) {
  console.error("sheetId is a required parameter");
  process.exit();
}

updateSchedule({
  credentialsPath: argv.credsPath,
  sheetId: argv.sheetId,
  dryRun: !!argv.dryRun,
});
