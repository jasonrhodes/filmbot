# filmbot

Little bot to do film club stuff

## How to use

First, you need to get auth sorted.

### Authentication

You'll need a Google credentials file. I got one following these steps:

https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=service-account

#### Storing and accessing your credentials file

There are several options:

- Pass in the path to your json credentials file via `--credsFile` in the CLI tool when running commands
- Create a directory called SECRETS in the root of this directory and move your service account key file (.json) into the SECRETS directory, named google-credentials.json (everything in this directory is in .gitignore)
- Export a system env variable called FILMBOT_JSON_CREDS_PATH that contains the absolute path to your credentials file.

### Dependencies

You need to have nodejs and npm installed to run this project. More here: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm

Once you have those, navigate to the root of this project and run `npm install` to download the necessary JS dependencies.

### Google sheet format

1. Should have 2 columns: "Month" and "MC"
2. Should have tabs representing months, in M YYYY format and in l-r descending order (e.g. June 2021, May 2021, June 2021)

## update-schedule

_Note:_ Using this script is currently dependent on time. If the left-most tab in your sheet is labelled "Sepember 2021" and you run it in Sept of 2021, it will do nothing. You'll have to wait until your local time is in Oct of 2021 for it to run.

### Usage

```sh
$ npm run update-schedule -- --sheetId="{your Google sheet ID}"
```

Use `--dry-run` to print output without updating any files.

### Stats Analysis

Update schedule will also do stats analysis of the Google Worksheet. This can take some time because it has to interact with the Google sheets API many times to get all of the stats from the remote worksheet. You can save the retrieved stats to a local cache file:

```
npm run update-schedule -- --sheetId="{your Google sheet ID} --cache-stats
```

To use your cached stats file in subsequent runs:

```
npm run update-schedule -- --sheetId="{your Google sheet ID} --use-stats-cache="./stats-cache.json"
```