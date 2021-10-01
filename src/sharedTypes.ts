export interface UpdateArgs {
  credentialsPath?: string;
  sheetId: string;
  noAuth?: boolean;
}

export interface Person {
  name: string;
  greened: boolean;
  index: number;
}
