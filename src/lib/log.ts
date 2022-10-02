export function log(...values) {
  process.stdout.write('\n');
  console.log(`[${(new Date()).toISOString()}]`, ...values);
}