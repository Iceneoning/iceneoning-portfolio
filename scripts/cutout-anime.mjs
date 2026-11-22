// Removes the flat white background around chibi stickers and writes a transparent PNG.
// Usage: node scripts/cutout-anime.mjs <input.(jpg|png)> <output.png> [size=640]
// Only white pixels connected to the image border are removed, so white clothing
// enclosed by the character's dark outline is preserved.
import sharp from 'sharp';

const [input, output, sizeArgument = '640'] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/cutout-anime.mjs <input> <output.png> [size]');
  process.exit(1);
}

const size = Number(sizeArgument);
const { data, info } = await sharp(input)
  .resize(size, size, { fit: 'contain', background: '#ffffff' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const pixelCount = width * height;
const whiteness = (i) => Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
const chroma = (i) => Math.max(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) - whiteness(i);
const isPaper = (i) => whiteness(i) >= 228 && chroma(i) <= 22;

const background = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;
const seed = (i) => {
  if (!background[i] && isPaper(i)) { background[i] = 1; queue[tail++] = i; }
};
for (let x = 0; x < width; x++) { seed(x); seed((height - 1) * width + x); }
for (let y = 0; y < height; y++) { seed(y * width); seed(y * width + width - 1); }
while (head < tail) {
  const i = queue[head++];
  const x = i % width;
  const y = (i - x) / width;
  if (x > 0) seed(i - 1);
  if (x < width - 1) seed(i + 1);
  if (y > 0) seed(i - width);
  if (y < height - 1) seed(i + width);
}

for (let i = 0; i < pixelCount; i++) {
  if (background[i]) { data[i * 4 + 3] = 0; continue; }
  // Soften the light anti-aliased fringe that touches the removed background.
  const x = i % width;
  const touchesBackground = (x > 0 && background[i - 1]) || (x < width - 1 && background[i + 1])
    || (i >= width && background[i - width]) || (i < pixelCount - width && background[i + width]);
  const light = whiteness(i);
  if (touchesBackground && light > 170) {
    data[i * 4 + 3] = Math.max(0, Math.min(255, Math.round((255 - light) * 255 / 85)));
  }
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9, palette: false })
  .toFile(output);
console.log(`Wrote ${output} (${width}x${height})`);
