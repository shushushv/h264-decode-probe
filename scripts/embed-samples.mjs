import { readFile, writeFile } from 'node:fs/promises';

const specs = [
  {
    name: 'black-2160p-baseline51',
    file: 'samples/black-2160p-baseline51.h264',
    codec: 'avc1.42c033',
    width: 3840,
    height: 2160,
  },
  {
    name: 'black-1080p-baseline40',
    file: 'samples/black-1080p-baseline40.h264',
    codec: 'avc1.42c028',
    width: 1920,
    height: 1080,
  },
  {
    name: 'black-720p-baseline31',
    file: 'samples/black-720p-baseline31.h264',
    codec: 'avc1.42c01f',
    width: 1280,
    height: 720,
  },
];

const rows = await Promise.all(
  specs.map(async (spec) => ({
    ...spec,
    base64: (await readFile(spec.file)).toString('base64'),
  })),
);

const output = `function b64(s) {
  var bin = atob(s);
  var data = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i += 1) data[i] = bin.charCodeAt(i);
  return data;
}

export const h264Samples = [
${rows
  .map(
    (row) => `  {
    name: '${row.name}',
    codec: '${row.codec}',
    width: ${row.width},
    height: ${row.height},
    format: 'annexb',
    data: b64('${row.base64}'),
  }`,
  )
  .join(',\n')}
];
`;

await writeFile('src/sample-data.js', output);
