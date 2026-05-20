import { h264Samples, probeH264DecodeDetailed } from './index.js';
import './styles.css';

const probe = document.getElementById('probe');
const tbody = document.getElementById('results');
const status = document.getElementById('status');
const summary = document.getElementById('summary');

function formatMs(value) {
  if (typeof value !== 'number') return '-';
  return value < 10 ? value.toFixed(2) + ' ms' : value.toFixed(1) + ' ms';
}

function formatBytes(value) {
  if (!value) return '-';
  if (value < 1024) return value + ' B';
  return (value / 1024).toFixed(1) + ' KB';
}

function statusLabel(attempt) {
  if (attempt.error) return ['error', attempt.error.name];
  if (!attempt.result.supported) return ['warn', 'unsupported'];
  if (!attempt.result.decoded) return ['warn', 'no frame'];
  return ['ok', 'decoded'];
}

function rowHtml(attempt) {
  const sample = attempt.sample;
  const result = attempt.result || {};
  const error = attempt.error;
  const label = statusLabel(attempt);
  const output = result.width && result.height ? result.width + 'x' + result.height : '-';
  const detail = error ? error.message : 'frames=' + (result.outputFrames || 0);

  return (
    '<tr>' +
    '<td><strong>' + sample.width + 'x' + sample.height + '</strong><span>' + sample.name + '</span></td>' +
    '<td><code>' + sample.codec + '</code></td>' +
    '<td>' + formatBytes(sample.data && sample.data.byteLength) + '</td>' +
    '<td><span class="pill ' + label[0] + '">' + label[1] + '</span></td>' +
    '<td>' + (result.supported === undefined ? '-' : String(result.supported)) + '</td>' +
    '<td>' + (result.decoded === undefined ? '-' : String(result.decoded)) + '</td>' +
    '<td>' + output + '</td>' +
    '<td>' + formatMs(result.durationMs) + '</td>' +
    '<td class="detail">' + detail + '</td>' +
    '</tr>'
  );
}

function renderPending() {
  tbody.innerHTML = h264Samples
    .map(function renderSample(sample) {
      return (
        '<tr>' +
        '<td><strong>' + sample.width + 'x' + sample.height + '</strong><span>' + sample.name + '</span></td>' +
        '<td><code>' + sample.codec + '</code></td>' +
        '<td>' + formatBytes(sample.data.byteLength) + '</td>' +
        '<td><span class="pill idle">pending</span></td>' +
        '<td>-</td><td>-</td><td>-</td><td>-</td><td class="detail">Click Probe to run</td>' +
        '</tr>'
      );
    })
    .join('');
}

function renderResult(result) {
  const decoded = result.attempts.filter(function count(attempt) {
    return attempt.result && attempt.result.decoded;
  });
  summary.textContent = result.decoded
    ? 'Max decoded resolution: ' + result.match.sample.width + 'x' + result.match.sample.height
    : 'No sample decoded. Check row details for the failing layer.';
  status.textContent = decoded.length + '/' + result.attempts.length + ' samples decoded';
  tbody.innerHTML = result.attempts.map(rowHtml).join('');
}

renderPending();
status.textContent = 'ready';

probe.onclick = async function onProbeClick() {
  status.textContent = 'probing...';
  summary.textContent = 'Running real H264 decode attempts.';
  probe.disabled = true;
  try {
    renderResult(await probeH264DecodeDetailed(h264Samples));
  } catch (error) {
    status.textContent = 'probe failed';
    summary.textContent = error && error.stack ? error.stack : String(error);
  } finally {
    probe.disabled = false;
  }
};
