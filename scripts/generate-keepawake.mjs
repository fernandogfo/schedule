import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'public', 'assets', 'audio', 'keepawake.wav');

// 20 Hz is infrasound: inaudible on regular speakers/headphones, but the
// non-silent digital signal keeps the browser from marking the tab as idle
// (tabs "playing audio" are exempt from background timer throttling and
// freezing). The signal stays well above the browser silence-detection
// threshold even after the element volume is applied in keepAwake.ts.
const SAMPLE_RATE = 8000;
const DURATION_SECONDS = 6;
const FREQUENCY_HZ = 20;
const AMPLITUDE = 0.3;

const samplesPerCycle = SAMPLE_RATE / FREQUENCY_HZ;
const totalSamples = SAMPLE_RATE * DURATION_SECONDS;

if (!Number.isInteger(totalSamples / samplesPerCycle)) {
  throw new Error('Duration must contain a whole number of cycles.');
}

const data = Buffer.alloc(totalSamples * 2);
for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
  const angle = (2 * Math.PI * sampleIndex) / samplesPerCycle;
  const value = Math.round(Math.sin(angle) * AMPLITUDE * 32767);
  data.writeInt16LE(value, sampleIndex * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0, 'ascii');
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8, 'ascii');
header.write('fmt ', 12, 'ascii');
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(SAMPLE_RATE, 24);
header.writeUInt32LE(SAMPLE_RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36, 'ascii');
header.writeUInt32LE(data.length, 40);

writeFileSync(outputPath, Buffer.concat([header, data]));
console.log(
  `Wrote ${outputPath} (${DURATION_SECONDS}s, ${FREQUENCY_HZ}Hz, ${totalSamples} samples).`,
);
