import type { Project } from './projects';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Static-build convention: adding an asset here needs no page or MDX edit.
// Called only by Astro server frontmatter during static generation / local dev.
// Importing public media with Vite would emit a second copy into /_astro/.
const publicDirectory = resolve(process.cwd(), 'public');
const available = (path: string) => existsSync(resolve(publicDirectory, `.${path}`));

export function getProjectMedia(project: Project) {
  const directory = `/media/projects/${project.id}`;
  const uploadedCover = ['webp', 'png', 'jpg'].map((extension) => `${directory}/cover.${extension}`).find(available);
  const cover = project.data.mediaApproved && project.data.cover ? project.data.cover : uploadedCover;
  const sources = [
    { src: `${directory}/demo.webm`, type: 'video/webm' },
    { src: `${directory}/demo.mp4`, type: 'video/mp4' },
  ].filter(({ src }) => available(src));
  return {
    cover,
    coverAlt: project.data.coverAlt ?? `${project.data.title} 项目画面`,
    coverCaption: project.data.coverCaption ?? `${project.data.title} · 项目画面`,
    awaitingCover: project.id === 'blitz-archive' && !cover,
    sources,
  };
}
