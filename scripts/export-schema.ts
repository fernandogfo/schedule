import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { scheduleDataSchema } from '../src/schemas/schedule';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'public', 'data', 'schedule.json');
const schemaFile = path.join(root, 'public', 'schedule.schema.json');

async function main() {
  const data = JSON.parse(await readFile(dataFile, 'utf8'));
  const result = scheduleDataSchema.safeParse(data);

  if (!result.success) {
    console.error(z.prettifyError(result.error));
    process.exitCode = 1;
    return;
  }

  const jsonSchema = z.toJSONSchema(scheduleDataSchema, {
    target: 'draft-7',
    unrepresentable: 'any',
  });

  const output = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'ArcheAge Event Schedule',
    ...jsonSchema,
  };

  await writeFile(
    schemaFile,
    `${JSON.stringify(output, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `Validated ${result.data.events.length} events, ${result.data.timers.length} timers and ${result.data.categories.length} categories.`,
  );
  console.log(`Schema: ${schemaFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
