import {
  buildToeicCatalog,
  writeToeicCatalogArtifacts,
} from '../src/entities/toeic-catalog/lib/catalog-builder';

function readArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;

  if (!value || value.startsWith('--')) {
    throw new Error(`Missing ${name} argument`);
  }

  return value;
}

const sourceDirectory = readArgument('--source');
const outputDirectory = readArgument('--out');
const result = buildToeicCatalog(sourceDirectory);

writeToeicCatalogArtifacts(outputDirectory, result);

console.log(
  `Wrote catalog and server grading index to ${outputDirectory}`,
);
if (result.incompleteTestIds.length > 0) {
  console.log(`Incomplete tests: ${result.incompleteTestIds.join(', ')}`);
}
