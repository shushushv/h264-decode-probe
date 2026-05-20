# H264 decode probe

Tiny browser probe for checking real H264 decode resolution with WebCodecs and
embedded Annex B samples.

## Browser usage

```js
import { h264Samples, probeH264Decode, decodeH264Sample } from './src/index.js';

console.log(await probeH264Decode(h264Samples));

// Force a codec string to test browser tolerance, even if the sample SPS declares
// a different level/profile.
console.log(await decodeH264Sample(h264Samples[0], { codec: 'avc1.42e01f' }));
```

The embedded samples are one-frame black H264 Annex B bitstreams:

- `3840x2160`, `avc1.42c033`, about 26 KB
- `1920x1080`, `avc1.42c028`, about 7 KB
- `1280x720`, `avc1.42c01f`, about 4 KB

Run the demo:

```bash
python3 -m http.server 8765
open http://127.0.0.1:8765/demo.html
```

Regenerate sample modules after changing `samples/*.h264`:

```bash
npm run build:samples
npm run check
```
