export interface ActivityRow {
  accountName: string;
  reason: string;
  timePosted: string;
  crRitm: string;
  concernTeam: string;
  quarter: string;
  environment: string;
  // Keep raw for any extra columns
  [key: string]: string;
}
