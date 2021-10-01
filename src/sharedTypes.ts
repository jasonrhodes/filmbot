export interface UpdateArgs {
  credentialsPath?: string;
  sheetId: string;
  noAuth?: boolean;
  dryRun?: boolean;
}

export interface Person {
  name: string;
  greened: boolean;
  index: number;
}
