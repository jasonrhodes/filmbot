import { getWatchStats } from "./getWatchStats";
import { getSheetsToUpdateForDoc } from "./lib/sheets";
import { writeFile, readFile } from "fs";
import {
  getGreenStatus,
  getNextMonthTitle,
  reorderByGreenStatus,
} from "./lib/utils";
import { Person, UpdateArgs, WatchStats } from "./sharedTypes";

type PeopleMapResult = Omit<Person, 'index'> | null;

async function getStatsFromCache(path: string): Promise<WatchStats[]> {
  return new Promise((resolve, reject) => {
    readFile(path, 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const results = JSON.parse(data) as WatchStats[];
          resolve(results);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

async function writeStatsToCache(stats: WatchStats[], path: string) {
  return new Promise((resolve, reject) => {
    writeFile(path, JSON.stringify(stats), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  })
}

export async function updateSchedule({
  credentialsPath,
  sheetId,
  opts = {}
}: UpdateArgs) {
  const stats = opts.useStatsCache ? await getStatsFromCache(opts.useStatsCache) : await getWatchStats({ sheetId, includeCurrentMonth: true });

  if (opts.cacheStats) {
    writeStatsToCache(stats, './stats-cache.json');
  }

  // Wait 1m to make sure watch stats rate limiting has passed
  if (!opts.useStatsCache) {
    console.log("Pausing analysis to wait for rate-limiting...");
    await new Promise((resolve) => setTimeout(resolve, 60000));
    console.log("Restarting analysis");
  }

  const [previousMonthSheet, newMonthSheet] = await getSheetsToUpdateForDoc({
    id: sheetId,
    credentialsPath,
    dryRun: opts.dryRun
  });

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
  const allPeople = previousRows
    .map<PeopleMapResult>((row, i) => {
      const cell = previousMonthSheet.getCell(row.rowIndex - 1, 1);
      const statsForUser = stats.find((user) => user.Username === row.MC);
      return {
        name: row.MC,
        greened: getGreenStatus(cell),
        stats: statsForUser,
        previousIndex: i - 1
      };
    });

  const activePeople = allPeople.filter((person) => person.stats?.Active);
  
  const previousChooser = activePeople.shift();
  activePeople.push(previousChooser);
  const indexedPeople = activePeople.map<Person>((person, i) => ({
    ...person,
    index: i
  }));
  
  // console.log("dump indexed people", JSON.stringify(indexedPeople, null, 2));

  console.log("");
  
  const inactive = stats.filter(user => !user['Active']);

  // console.log("INACTIVES", JSON.stringify(inactive.map(({ Username }) => Username), null, 2));
  // console.log("PEEPS", JSON.stringify(allPeople.map(({ name }) => name), null, 2));

  const newlyDropped = inactive.filter(inactivePerson => allPeople.find(currentPerson => inactivePerson['Username'].toLowerCase() === currentPerson.name.toLowerCase()));
  console.log("🚨 🚨 🚨");
  console.log("Newly Dropped Users:\n");
  newlyDropped.forEach(stat => console.log(
    stat.Username,
    `Streak: ${stat['Current Streak']} ${stat['Current Streak Type']}`,
    '/',
    `Total Watches: ${stat['Total Greens']}`
  ));

  console.log("");

  const emeritus = inactive.filter(inactivePerson => !allPeople.find(currentPerson => inactivePerson['Username'].toLowerCase() === currentPerson.name.toLowerCase()));
  console.log("👋 👋 👋");
  console.log("Film Club Emeriti:\n");
  emeritus.forEach(stat => console.log(
    stat.Username,
    `Tenure: ${stat['Tenure']}`,
    '/',
    `Total Watches: ${stat['Total Greens']}`
  ));

  console.log("");

  const inDanger = stats.filter(user => user['In Danger']);
  console.log("⚠️ ⚠️ ⚠️");
  console.log("In danger of dropping in the next month or two\n");
  if (inDanger.length === 0) {
    console.log("Nobody! Good job, everyone!")
  } else {
    inDanger.forEach(stat => console.log(
      stat.Username,
      `Current Streak: ${stat['Current Streak']} ${stat['Current Streak Type']}`
    ));
  }

  console.log(`\nREORDERING THOSE WHO REMAIN...\n`);

  // reorder MCs based on greened status
  const reorderedPeople = reorderByGreenStatus(indexedPeople, months);

  // console.log("Finished reordering people");
  // console.log(JSON.stringify(reorderedPeople, null, 2));

  reorderedPeople.forEach((person, i) => {
    const monthName = months[i];
    person.stats = stats.find(s => s.Username.toLowerCase() === person.name.toLowerCase());
    let mentioned = false;
    const diff = person.previousIndex - person.index;
    if (i === 0) {
      console.log(`${person.name}: 🎥 IT'S YOUR MONTH! 🎉🎉🎉`);
      mentioned = true;
    } else if (i === 1) {
      console.log(
        `${person.name}: 🔒 You're locked in for ${monthName} 🙌 🙌 🙌`
      );
      mentioned = true;
    } else if (person.index === reorderedPeople.length - 1) {
      console.log(`${person.name} has fulfilled their film club duty and will choose again on ${monthName}. Thanks, ${person.name}!`);
      mentioned = true;
    } else if (person.greened && diff === 0) {
      console.log(
        `${person.name}: 🟢 You're still scheduled for ${monthName}`
      );
      mentioned = true;
    } else if (!person.greened && diff === -1) {
      console.log(
        `${person.name}: 😢 You drop back a month to ${monthName}`
      );
      mentioned = true;
    } else if (!person.greened && diff > 0) {
      console.log(
        `${person.name}: 😤 you got VERY lucky! You missed this month but you moved up ${diff} months to ${monthName}!`
      );
      mentioned = true;
    } else if (!person.greened && diff === 0) {
      console.log(
        `${person.name}: 😎 you got lucky! You missed this month but you stayed scheduled for ${monthName}`
      );
      mentioned = true;
    } else if (diff > 0) {
      console.log(
        `${person.name}: ⏫ woot! You moved up to ${monthName} (a ${diff} month jump!)`
      );
      mentioned = true;
    } else {
      console.log(
        `Uh oh, ${person.name} moved back by more than one spot (${
          diff
        }), this isn't supposed to happen [[Diagnostics - i: ${i}, finalList length: ${activePeople.length}, previousChooser: ${previousChooser.name} ]]`
      );
      throw new Error("Reordering error");
    }
    mentioned && person.stats && person.stats.Active ? 
      console.log(`Tenure: ${person.stats['Tenure']} | Watch Pct: ${Math.round(person.stats['Watch %'] * 100)}% | Current Streak: ${person.stats['Current Streak']} ${person.stats['Current Streak Type']} | Last Watch: ${person.stats['Last Watched?']} \n`) : 
      console.log("\n");
  });

  // const l = reorderedPeople.length;
  // const lp = reorderedPeople[l - 1];
  // console.log("DEBUG", l, lp.name, lp.index);

  if (opts.dryRun) {
    console.log("Dry run complete! (No updates performed)");

    // console.log(JSON.stringify({ months, reorderedPeople }, null, 2));
    return;
  }

  if (!newMonthSheet) {
    throw new Error("Missing new month sheet, not created for some reason");
  }

  // make new rows
  const newRows = reorderedPeople.map((person, i) => ({
    MC: person.name,
    Month: months[i]
  }));

  // add new rows to new sheet
  newMonthSheet.addRows(newRows);

  // TODO: add in placeholders for the movie title cells
  // TODO: add formatting for all cells

  await newMonthSheet.saveUpdatedCells();

  console.log("Update complete!");
}
