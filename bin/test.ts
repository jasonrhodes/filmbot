function printProgress(value) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(value);
}

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('first line stays?');
  printProgress('Attempting to do stuff...');
  await wait(2000);
  printProgress('Waiting 1');
  await wait(2000);
  printProgress('Waiting 2');
  await wait(2000);
  printProgress('wwwwwaaaaaaiiiiiiittttttttiiiinnnnnggggngnngngng 3');
  await wait(2000);
  printProgress('All done!\n');
  await wait(2000);
  console.log('next line right?');
}

main();