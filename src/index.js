import { h264Samples } from './sample-data.js';

export { h264Samples };

export async function decodeH264Sample(sample, options = {}) {
  if (!globalThis.VideoDecoder) {
    throw new Error('VideoDecoder is not available in this environment');
  }

  const config = {
    codec: options.codec || sample.codec,
    codedWidth: sample.width,
    codedHeight: sample.height,
    hardwareAcceleration: options.hardwareAcceleration || 'prefer-hardware',
    optimizeForLatency: true,
  };

  const startedAt = performance.now();
  if (VideoDecoder.isConfigSupported) {
    const support = await VideoDecoder.isConfigSupported(config);
    if (!support.supported) {
      return {
        supported: false,
        decoded: false,
        outputFrames: 0,
        durationMs: performance.now() - startedAt,
        config: support.config || config,
      };
    }
  }

  let frameInfo;
  let decodeError;
  let outputFrames = 0;
  const decoder = new VideoDecoder({
    output(frame) {
      outputFrames += 1;
      frameInfo = {
        width: frame.codedWidth,
        height: frame.codedHeight,
        timestamp: frame.timestamp,
      };
      frame.close();
    },
    error(error) {
      decodeError = error;
    },
  });

  try {
    decoder.configure(config);
    decoder.decode(
      new EncodedVideoChunk({
        type: 'key',
        timestamp: 0,
        data: sample.data,
      }),
    );
    await decoder.flush();
  } finally {
    decoder.close();
  }

  if (decodeError) {
    throw decodeError;
  }

  return {
    supported: true,
    decoded: Boolean(frameInfo),
    outputFrames,
    durationMs: performance.now() - startedAt,
    width: frameInfo?.width,
    height: frameInfo?.height,
    config,
  };
}

export async function probeH264Decode(samples = h264Samples, options = {}) {
  for (const sample of samples) {
    try {
      const result = await decodeH264Sample(sample, options);
      if (result.decoded) {
        return { ...result, sample };
      }
    } catch (error) {
      if (options.throwOnError) throw error;
    }
  }
  return null;
}

export async function probeH264DecodeDetailed(samples = h264Samples, options = {}) {
  const attempts = [];
  let match = null;

  for (const sample of samples) {
    try {
      const result = await decodeH264Sample(sample, options);
      const attempt = { sample, result };
      attempts.push(attempt);
      if (result.decoded && !match) match = attempt;
    } catch (error) {
      attempts.push({
        sample,
        error: {
          name: error?.name || 'Error',
          message: error?.message || String(error),
        },
      });
      if (options.throwOnError) throw error;
    }
  }

  return { decoded: Boolean(match), match, attempts };
}
