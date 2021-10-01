# filmbot

Little bot to do film club stuff

## How to use

First, you need to get auth sorted.

### Authentication

1. You'll need a Google credentials file. I got one following these steps:

https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=service-account

2. Create a directory called SECRETS in the root of this directory (it will be auto gitignored)

3. Move your service account key file (.json) into the SECRETS directory, named google-credentials.json (it will also be auto gitignored, I promise!)

Note: you can also pass in the path to your json file via `--credsFile` in the CLI tool if you don't want to move it into the repo.

### Dependencies

You need to have nodejs and npm installed to run this project. More here: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm#using-a-node-version-manager-to-install-nodejs-and-npm

Once you have those, navigate to the root of this project and run `npm install` to download the necessary JS dependencies.

### Google sheet format

1. Should have 2 columns: "Month" and "MC"
2. Should have tabs representing months, in M YYYY format and in l-r descending order (e.g. June 2021, May 2021, June 2021)

More details TBD

### Using the script

Using this script is currently dependent on time. If the left-most tab in your sheet is labelled "Sepember 2021" and you run it in Sept of 2021, it will do nothing. You'll have to wait until your local time is in Oct of 2021 for it to run.

TODO: Make the target dates into passable args.

```sh
$ npm run updateSchedule -- --sheetId="{your Google sheet ID}"
```

You can also store the credentials file in a different place, with a different name, if you want:

```sh
$ npm run updateSchedule -- --sheetId="{your Google sheet ID}" --credsFile="/path/to/your/key-file.json"
```
