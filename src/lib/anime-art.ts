import type { ImageMetadata } from 'astro';
import type { ProjectCategory } from '../config/project-sections';
// 首屏 / 关于区插画由站长提供（原图位于 public/picture/）。
import hero from '../assets/anime/hero-snow.jpg';
import about from '../assets/anime/about-mika.jpg';
import chibi from '../assets/anime/chibi.png';
import chibiGames from '../assets/anime/chibi-games.png';
import chibiGraphics from '../assets/anime/chibi-graphics.png';
import chibiFrontend from '../assets/anime/chibi-frontend.png';
import chibiBackend from '../assets/anime/chibi-backend.png';
import chibiMisc from '../assets/anime/chibi-misc.png';
import chibiLost from '../assets/anime/chibi-404.png';

/**
 * 原创看板娘「冰霓」插画（AI 绘制）。替换图片时保持文件名不变即可，
 * Q 版图片需要透明背景，可用 `node scripts/cutout-anime.mjs` 去除纯白底。
 */
export const animeArt = { hero, about, chibi, chibiLost };

export const sectionChibi: Record<ProjectCategory, ImageMetadata> = {
  games: chibiGames,
  graphics: chibiGraphics,
  frontend: chibiFrontend,
  backend: chibiBackend,
  misc: chibiMisc,
};
