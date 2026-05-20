import { h264Samples, probeH264DecodeDetailed } from './index.js';

const probe = document.getElementById('probe');
const out = document.getElementById('out');

function stringifyResult(result) {
  return JSON.stringify(
    result,
    function replaceBinary(key, value) {
      if (key === 'data') return '<' + value.byteLength + ' bytes>';
      return value;
    },
    2,
  );
}

out.textContent = 'ready';

probe.onclick = async function onProbeClick() {
  out.textContent = 'probing...';
  try {
    const result = await probeH264DecodeDetailed(h264Samples);
    out.textContent = stringifyResult(result);
  } catch (error) {
    out.textContent = error && error.stack ? error.stack : String(error);
  }
};
