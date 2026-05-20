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

  if (VideoDecoder.isConfigSupported) {
    const support = await VideoDecoder.isConfigSupported(config);
    if (!support.supported) {
      return { supported: false, decoded: false, config: support.config || config };
    }
  }

  let frameInfo;
  const decoder = new VideoDecoder({
    output(frame) {
      frameInfo = {
        width: frame.codedWidth,
        height: frame.codedHeight,
        timestamp: frame.timestamp,
      };
      frame.close();
    },
    error(error) {
      throw error;
    },
  });

  decoder.configure(config);
  decoder.decode(
    new EncodedVideoChunk({
      type: 'key',
      timestamp: 0,
      data: sample.data,
    }),
  );
  await decoder.flush();
  decoder.close();

  return {
    supported: true,
    decoded: Boolean(frameInfo),
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
