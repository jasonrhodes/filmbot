import { GoogleSpreadsheet } from "google-spreadsheet";
import { getSheetFromDoc, initDoc } from "./lib/sheets";
import {
  getGreenStatus
} from "./lib/utils";
import { StatsArgs, WatchStats } from "./sharedTypes";

import axios from "axios";



interface User {
  username: string;
  months: Set<string>;
  active: boolean;
  justDropped?: boolean;
  inDanger: boolean;
}

interface ProcessSheetOptions {
  index: number;
  doc: GoogleSpreadsheet;
  users?: User[];
  tries?: number;
  includeCurrentMonth?: boolean;
  completed: number[];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeLowerCase(x: any) {
  return (typeof x === "string") ? x.toLowerCase() : x;
}

const MONTH_STATES = {
  GREEN: "green",
  MISS: "miss"
};

function getMonthState(month: string, greened: boolean) {
  return `${month}::${greened ? MONTH_STATES.GREEN : MONTH_STATES.MISS }`;
}

async function processSheet({ 
  index, 
  doc, 
  includeCurrentMonth = false, 
  users = [], 
  tries = 1, 
  completed = [] 
}: ProcessSheetOptions): Promise<{ users: User[], completed: number[] }> {
  const finalIndex = includeCurrentMonth ? 0 : 1;
  // console.log(`Include current month? ${includeCurrentMonth}, ${index} < ${finalIndex} ?`);
  if (index < finalIndex) {
    return { users, completed };
  }
  const sheet = await getSheetFromDoc({ cachedDoc: doc, index });
  
  if (!sheet) {
    throw new Error(`Sheet missing for index ${index}`);
  }

  const rows = await sheet.getRows();

  if (!rows[1] || typeof rows[1] !== "object" || !rows[1].MC || !rows[1].Month) {
    console.log(`Skipping invalid sheet ${sheet.title}`);
    return await processSheet({ index: index - 1, doc: doc, users, completed, includeCurrentMonth });
  }

  // console.log("Processing rows", rows.length, "for", sheet.title);

  // console.log(`Begin mutation: ${sheet.title} | ${index}`);
  
  for (let i = 0; i < rows.length; i++) {
    const { MC } = rows[i];
    const cell = await sheet.getCell(rows[i].rowIndex - 1, 1);
    const greened = await getGreenStatus(cell);
    const found = users.find((user) => safeLowerCase(user.username) === safeLowerCase(MC));
    const thisMonthState = getMonthState(sheet.title, greened);

    if (!found) {
      const newlyFoundUser = {
        username: MC,
        months: new Set<string>([thisMonthState]),
        active: true,
        inDanger: false
      };
      users.push(newlyFoundUser);
    }

    if (found) {
      if (!found.months.has(thisMonthState)) {
        found.months.add(thisMonthState);
      } else {
        // console.log(`Skipping duplicate entry for ${MC} + ${thisMonthState}`);
      }
      
    }
  }

  const watchedState = getMonthState(sheet.title, true);
  const missedState = getMonthState(sheet.title, false);

  users.forEach((user) => {
    if (!user.months.has(watchedState) && !user.months.has(missedState)) {
      user.months.add(missedState);
    }
  });

  // console.log(`End mutation: ${sheet.title} | ${index}`);

  completed.push(index);

  const nextIndex = index - 1;

  try {
    // console.log(`Initial try to process next month for tab index: ${index - 1}`)
    return await processSheet({ index: nextIndex, doc: doc, users, completed, includeCurrentMonth });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response.status === 429 && tries <= 5) {
      const pause = 10 * tries * 1.2;
      // console.log(`Rate limit reached (${tries} time(s)), waiting ${pause} seconds to try again for try ${tries} for month ${sheet.title} | ${index}...`);
      await wait(pause * 1000);
      // console.log(`Trying again (try ${tries}) now for ${sheet.title} | ${index}`);
      return await processSheet({ index: nextIndex, includeCurrentMonth, doc: doc, users, tries: tries + 1, completed });
    } else {
      throw error;
    }
  }
}

export async function getWatchStats({
  sheetId,
  includeCurrentMonth = false,
  months
}: StatsArgs) {

  console.log('gws 1');

  const doc = await initDoc(sheetId);

  console.log('gws 2');

  const sheetCount = doc.sheetsByIndex.length;

  console.log('gws 3');

  const monthsToProcess = months ? months : sheetCount - 1;

  console.log('gws 4');

  const { users } = await processSheet({ doc, includeCurrentMonth, index: monthsToProcess, completed: [] });

  console.log('gws 5');

  const processed = users.map<WatchStats>((user) => {
    const monthArray = Array.from(user.months);
    const watches = monthArray.filter(m => m.endsWith(MONTH_STATES.GREEN));
    const misses = monthArray.filter(m => m.endsWith(MONTH_STATES.MISS));
    const streaks = monthArray.reduce((streaks, monthState) => {
      if (monthState.endsWith(MONTH_STATES.GREEN)) {
        if (!streaks.lastState || streaks.lastState === MONTH_STATES.GREEN) {
          streaks.lastState = MONTH_STATES.GREEN;
          streaks.currentWatchStreak += 1;
          streaks.longestWatchStreak = 
            Math.max(streaks.longestWatchStreak, streaks.currentWatchStreak);
        } else {
          streaks.currentMissStreak = 0;
          streaks.currentWatchStreak = 1;
          streaks.lastState = MONTH_STATES.GREEN;
        }
      } else if (monthState.endsWith(MONTH_STATES.MISS)) {
        if (!streaks.lastState || streaks.lastState === MONTH_STATES.MISS) {
          streaks.lastState = MONTH_STATES.MISS;
          streaks.currentMissStreak += 1;
          streaks.longestMissStreak = 
            Math.max(streaks.longestMissStreak, streaks.currentMissStreak);
        } else {
          streaks.currentWatchStreak = 0;
          streaks.currentMissStreak = 1;
          streaks.lastState = MONTH_STATES.MISS;
        }
      }
      return streaks;
    }, {
      lastState: '',
      currentWatchStreak: 0,
      currentMissStreak: 0,
      longestWatchStreak: 0,
      longestMissStreak: 0
    });

    if (streaks.currentMissStreak >= 12 || watches.length === 0) {
      if (user.active) {
        user.justDropped = true;
      }
      user.active = false;
    } else {
      user.active = true;
    }

    user.inDanger = (user.active && streaks.currentMissStreak >= 10 && streaks.currentMissStreak <= 12);

    return {
      Username: user.username,
      ['Tenure']: user.months.size,
      ['Active']: user.active,
      ['In Danger']: user.inDanger,
      ['Total Greens']: watches.length,
      ['Total Missed']: misses.length,
      ['Watch %']: watches.length / user.months.size,
      ['Current Streak']: streaks.currentWatchStreak || streaks.currentMissStreak,
      ['Current Streak Type']: streaks.currentWatchStreak > 0 ? "watches" : "misses",
      ['Last Watched?']: watches[watches.length - 1] ? watches[watches.length - 1].slice(0, -7) :  "Never",
      ['Last Watched (Months Ago)']: streaks.currentMissStreak,
      ['Longest Green Streak']: streaks.longestWatchStreak,
      ['Longest Miss Streak']: streaks.longestMissStreak,
      ['Month Statuses']: monthArray.join(", "),
      ['Streak JSON']: JSON.stringify(streaks)
    };
  });

  return processed;
}

