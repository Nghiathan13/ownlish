import { readFile, writeFile } from 'node:fs/promises';
import { createProfileBaseline } from './baseline-utils.mjs';

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const profileName = optionValue('--profile');
  const paths = process.argv.slice(2).filter((value, index, values) => {
    return (
      value !== '--' &&
      value !== '--profile' &&
      values[index - 1] !== '--profile'
    );
  });
  const profiles = JSON.parse(
    await readFile(new URL('./profiles.json', import.meta.url), 'utf8'),
  );

  if (!profileName || !profiles[profileName]) {
    throw new Error('Use --profile with a profile from performance/profiles.json');
  }

  const summaries = await Promise.all(
    paths.map(async (path) => JSON.parse(await readFile(path, 'utf8'))),
  );
  const metrics = JSON.parse(
    await readFile(new URL('./metrics.json', import.meta.url), 'utf8'),
  );
  const baselineUrl = new URL('./baseline.json', import.meta.url);
  const baseline = JSON.parse(await readFile(baselineUrl, 'utf8'));

  baseline.profiles[profileName] = {
    runs: summaries.length,
    p95Ms: createProfileBaseline(Object.keys(metrics), summaries),
  };

  await writeFile(baselineUrl, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`Updated ${profileName} baseline from ${summaries.length} runs.`);
}

void main();
