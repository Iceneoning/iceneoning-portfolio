// Preserve source media locally and publish browser-compatible assets below 25 MiB.
// Requires ffmpeg / ffprobe on PATH; uses the project's existing sharp package.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const limit = 25 * 1024 * 1024;
const targetBytes = 24 * 1024 * 1024;
const work = join(root, 'media-source', '.work');
const report = [];
const inputs = [
  { slug: 'challenge', incoming: 'public/Video/Challenge/Chanllenge.mp4', original: 'media-source/challenge/Chanllenge.mp4' },
  { slug: 'fps', incoming: 'public/Video/FPS/FPS.mp4', original: 'media-source/fps/FPS.mp4' },
  { slug: 'blitz-archive', incoming: 'public/Video/blitz-archive/BoardLine.mp4', original: 'media-source/blitz-archive/BoardLine.mp4' },
];

function workspacePath(relative) {
  const absolute = resolve(root, relative);
  if (!absolute.startsWith(root + sep)) throw new Error(`Path outside workspace: ${relative}`);
  return absolute;
}
async function exists(path) {
  try { await access(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
async function hash(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}
function run(command, args, { log, capture = false } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { if (capture) stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', async (code) => {
      try {
        if (log) await writeFile(log, stderr);
        if (code !== 0) throw new Error(`${command} failed (${code}): ${stderr.slice(-3000)}`);
        resolveRun(stdout);
      } catch (error) { reject(error); }
    });
  });
}
async function probe(path) {
  return JSON.parse(await run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path], { capture: true }));
}
async function sourceFor(item) {
  const incoming = workspacePath(item.incoming);
  const original = workspacePath(item.original);
  if (await exists(incoming)) return incoming;
  if (await exists(original)) return original;
  throw new Error(`Source media missing: ${item.incoming}`);
}

// Fail before encoding if a rerun would replace any published file or backup.
const coverItem = { incoming: 'public/media/projects/blitz-archive/未来学院护送战线.png', original: 'media-source/blitz-archive/未来学院护送战线.png' };
for (const item of [...inputs, coverItem]) {
  const source = await sourceFor(item);
  const original = workspacePath(item.original);
  if (source !== original && await exists(original)) throw new Error(`Archive destination already exists: ${original}`);
}
for (const destination of [...inputs.map((item) => workspacePath(`public/media/projects/${item.slug}/demo.mp4`)), workspacePath('public/media/projects/blitz-archive/cover.webp')]) {
  if (await exists(destination)) throw new Error(`Preserving existing output; move it aside before rerun: ${destination}`);
}
await mkdir(work, { recursive: true });
await Promise.all(inputs.map(async (item) => {
  const source = await sourceFor(item);
  const sourceHash = await hash(source);
  const metadata = await probe(source);
  const duration = Number(metadata.format.duration);
  const inputVideo = metadata.streams.find((stream) => stream.codec_type === 'video');
  const hasAudio = metadata.streams.some((stream) => stream.codec_type === 'audio');
  if (!Number.isFinite(duration) || duration <= 0 || !inputVideo) throw new Error(`Invalid source: ${source}`);
  const audioKbps = hasAudio ? 96 : 0;
  const videoKbps = Math.floor(targetBytes * 8 / duration / 1000 - audioKbps - 12);
  if (videoKbps < 300) throw new Error(`Video needs a different size strategy: ${item.slug}`);
  const temporary = join(work, `${item.slug}-demo.mp4`);
  const passlog = join(work, `${item.slug}-pass`);
  const common = ['-hide_banner', '-nostdin', '-y', '-i', source, '-map', '0:v:0',
    '-vf', "scale=-2:'min(720,ih)',setsar=1", '-r', '30', '-c:v', 'libx264', '-preset', 'medium',
    '-threads', '4', '-b:v', `${videoKbps}k`, '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-g', '60', '-passlogfile', passlog];
  console.log(`${item.slug}: ${duration.toFixed(2)}s, video ${videoKbps} kbps; encoding pass 1/2`);
  await run('ffmpeg', [...common, '-pass', '1', '-an', '-f', 'null', 'NUL'], { log: join(work, `${item.slug}-pass1.log`) });
  console.log(`${item.slug}: encoding pass 2/2`);
  await run('ffmpeg', [...common, '-map', '0:a:0?', '-pass', '2', '-c:a', 'aac', '-b:a', '96k',
    '-map_metadata', '-1', '-map_chapters', '-1', '-movflags', '+faststart', temporary], { log: join(work, `${item.slug}-pass2.log`) });
  const output = await probe(temporary);
  const outputVideo = output.streams.find((stream) => stream.codec_type === 'video');
  const outputAudio = output.streams.find((stream) => stream.codec_type === 'audio');
  const bytes = (await stat(temporary)).size;
  if (bytes >= limit || Math.abs(Number(output.format.duration) - duration) > 0.15
    || outputVideo.codec_name !== 'h264' || outputVideo.pix_fmt !== 'yuv420p'
    || (hasAudio && outputAudio?.codec_name !== 'aac')) throw new Error(`Output verification failed: ${item.slug}`);
  await run('ffmpeg', ['-v', 'error', '-xerror', '-nostdin', '-i', temporary, '-f', 'null', 'NUL'], { log: join(work, `${item.slug}-decode.log`) });
  const destination = workspacePath(`public/media/projects/${item.slug}/demo.mp4`);
  if (await exists(destination)) throw new Error(`Preserving existing output; move it aside before rerun: ${destination}`);
  await mkdir(dirname(destination), { recursive: true });
  await rename(temporary, destination);
  report.push({ slug: item.slug, kind: 'video', source, original: workspacePath(item.original), sourceHash,
    sourceBytes: Number(metadata.format.size), output: destination, outputBytes: bytes,
    duration: Number(output.format.duration), width: outputVideo.width, height: outputVideo.height,
    fps: outputVideo.avg_frame_rate, videoKbps, audioKbps });
  console.log(`${item.slug}: verified ${(bytes / 1024 / 1024).toFixed(2)} MiB`);
}));

const coverSource = await sourceFor(coverItem);
const coverHash = await hash(coverSource);
const coverDestination = workspacePath('public/media/projects/blitz-archive/cover.webp');
if (await exists(coverDestination)) throw new Error(`Preserving existing cover: ${coverDestination}`);
await sharp(coverSource).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(coverDestination);
const coverMetadata = await sharp(coverDestination).metadata();
const coverBytes = (await stat(coverDestination)).size;
if (coverBytes >= limit || coverMetadata.format !== 'webp') throw new Error('Cover verification failed');
report.push({ slug: 'blitz-archive', kind: 'cover', source: coverSource, original: workspacePath(coverItem.original),
  sourceHash: coverHash, sourceBytes: (await stat(coverSource)).size, output: coverDestination,
  outputBytes: coverBytes, width: coverMetadata.width, height: coverMetadata.height });

// Archive exact source files only after every encoded output has been verified.
for (const item of report) {
  if (await hash(item.source) !== item.sourceHash) throw new Error(`Source changed during processing: ${item.source}`);
  if (item.source !== item.original) {
    if (await exists(item.original)) throw new Error(`Archive destination already exists: ${item.original}`);
    await mkdir(dirname(item.original), { recursive: true });
    await rename(item.source, item.original);
  }
  if (await hash(item.original) !== item.sourceHash) throw new Error(`Archive verification failed: ${item.original}`);
}
await writeFile(join(root, 'media-source', 'optimization-report.json'), JSON.stringify({ limitBytes: limit, targetBytes, assets: report }, null, 2));
console.log(JSON.stringify(report.map(({ slug, kind, outputBytes, width, height, duration }) => ({ slug, kind, MiB: +(outputBytes / 1024 / 1024).toFixed(3), width, height, duration })), null, 2));
