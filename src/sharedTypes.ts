export interface SheetArgs {
  sheetId: string;
  credentialsPath?: string;
}

export interface UpdateArgs extends SheetArgs {
  noAuth?: boolean;
  opts?: {
    dryRun?: boolean;
    cacheStats?: boolean;
    useStatsCache?: string;
  }
}

export interface StatsArgs extends SheetArgs {
  months?: number;
  includeCurrentMonth?: boolean;
}

export type StreakType = "watches" | "misses";
export interface WatchStats {
  Username: string;
  ['Tenure']: number;
  ['Active']: boolean;
  ['In Danger']: boolean;
  ['Total Greens']: number;
  ['Total Missed']: number;
  ['Watch %']: number;
  ['Current Streak']: number;
  ['Current Streak Type']: StreakType;
  ['Last Watched?']: string;
  ['Last Watched (Months Ago)']: number;
  ['Longest Green Streak']: number;
  ['Longest Miss Streak']: number;
  ['Month Statuses']: string;
  ['Streak JSON']: string;
}
export interface Person {
  name: string;
  greened: boolean;
  index: number;
  stats?: WatchStats;
  previousIndex?: number;
}


