import { Color } from "google-spreadsheet";

const COLUMN_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SCHEDULE_RANGE = "A:B";
const MOVIE_PICKS_RANGE = "D2:E3";
const FONT_FAMILY = "Roboto, Verdana";
const COLORS: Record<string, Color> = {
  LIGHT_GREY: { red: 0.9372549, green: 0.9372549, blue: 0.9372549, alpha: 1 },
  WHITE: { red: 1, green: 1, blue: 1, alpha: 1 },
  GREEN: { red: 0, green: 1, blue: 0, alpha: 1 },
  YELLOW: { red: 1, green: 1, blue: 0.3294117, alpha: 1 },
};

export {
  COLUMN_LETTERS,
  SCHEDULE_RANGE,
  MOVIE_PICKS_RANGE,
  FONT_FAMILY,
  COLORS,
};
