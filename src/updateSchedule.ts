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

function logSectionHeader(header: string, emoji: string) {
  console.log(`\n=== ${emoji} ${emoji} ${emoji} ${header} ${emoji} ${emoji} ${emoji} ===\n`);
}

export async function updateSchedule({
  sheetId,
  opts = {}
}: UpdateArgs) {
  console.log('0 ok');
  const stats = opts.useStatsCache ? await getStatsFromCache(opts.useStatsCache) : await getWatchStats({ sheetId, includeCurrentMonth: true });

  console.log('0.1 ok');
  
  if (opts.cacheStats) {
    writeStatsToCache(stats, './stats-cache.json');
  }

  // Wait 1m to make sure watch stats rate limiting has passed
  if (!opts.useStatsCache) {
    console.log("Pausing analysis to wait for rate-limiting...");
    await new Promise((resolve) => setTimeout(resolve, 60000));
    console.log("Restarting analysis");
  }

  console.log('1 ok');

  const [previousMonthSheet, newMonthSheet] = await getSheetsToUpdateForDoc({
    id: sheetId,
    dryRun: opts.dryRun
  });

  console.log('2 ok');

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
    .map<PeopleMapResult>(({ MC, rowIndex }, i) => {
      const stringMC = typeof MC === "string" ? MC : '';
      const cell = previousMonthSheet.getCell(rowIndex - 1, 1);
      const statsForUser = stats.find((user) => user.Username.toLowerCase() === stringMC.toLowerCase());

      if (!statsForUser) {
        console.log(`Warning: no user stats found for ${MC}, this shouldn't happen`);
      }

      return {
        name: MC,
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
  
  const accidentallyDropped = allPeople.filter(p => !p.stats);
  logSectionHeader("ACCIDENTALLY DROPPED USERS", "🤦‍♂️");
  accidentallyDropped.forEach(person => console.log(person.name));
  if (accidentallyDropped.length === 0) {
    console.log("Nobody, phew (Psim you're safe … for now)");
  }
  
  const inactive = stats.filter(user => !user['Active']);
  const newlyDropped = inactive.filter(inactivePerson => allPeople.find(currentPerson => inactivePerson['Username'].toLowerCase() === currentPerson.name.toLowerCase()));

  logSectionHeader("NEWLY DROPPED USERS", "🚨");
  newlyDropped.forEach(stat => console.log(
    stat.Username,
    `Streak: ${stat['Current Streak']} ${stat['Current Streak Type']}`,
    '/',
    `Total Watches: ${stat['Total Greens']}`
  ));
  if (newlyDropped.length === 0) {
    console.log("Nobody! Keep watching, everyone!");
  }

  // Meh, let's not print the emeritus list
  
  // const emeritus = inactive.filter(inactivePerson => !allPeople.find(currentPerson => inactivePerson['Username'].toLowerCase() === currentPerson.name.toLowerCase()));
  // logSectionHeader("Film Club Emeriti", "👋");
  // emeritus.forEach(stat => console.log(
  //   stat.Username,
  //   `Tenure: ${stat['Tenure']}`,
  //   '/',
  //   `Total Watches: ${stat['Total Greens']}`
  // ));

  const inDanger = stats.filter(user => user['In Danger']);
  logSectionHeader("IN DANGER", "😬");
  if (inDanger.length === 0) {
    console.log("Nobody! You love to see it.")
  } else {
    inDanger.forEach(stat => console.log(
      stat.Username,
      `Current Streak: ${stat['Current Streak']} ${stat['Current Streak Type']}`
    ));
  }

  logSectionHeader("REORDERING THOSE WHO REMAIN", "🥁");

  // reorder MCs based on greened status
  const reorderedPeople = reorderByGreenStatus(indexedPeople, months);

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

  if (opts.dryRun) {
    console.log("Dry run complete! (No updates performed)");
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
