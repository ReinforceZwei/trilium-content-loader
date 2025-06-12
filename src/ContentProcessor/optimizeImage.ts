// @ts-ignore
import { getImage } from "astro:assets";
import type { ContentProcessor, NoteWithContent } from "../types.js";
import * as cheerio from 'cheerio';
import { GetImageResult } from "astro";

/**
 * Optimize remote image URLs in the content using Astro image service
 * @param content
 * @returns 
 */
export function optimizeRemoteImageUrls(): ContentProcessor {
  return async ({ content }: NoteWithContent) => {
    return optimizeRemoteImage(content)
  }
}

/**
 * Replace remote image source URLs (URLs starts with `http://` or `https://`) with optimized Astro image URLs.
 * The remote domain or URL pattern should be configurated in your `astro.config.mjs`
 * to make the optimization take effect.
 * See https://docs.astro.build/en/guides/images/#authorizing-remote-images
 * @param content 
 * @returns 
 */
export async function optimizeRemoteImage(content: string): Promise<string> {
  const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  let result = content;
  for (const match of content.matchAll(regex)) {
    const [fullMatch, src] = match;
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      continue;
    }
    const optimizedUrl = await getImage({ src, inferSize: true });
    result = result.replace(fullMatch, fullMatch.replace(src, optimizedUrl.src));
  }
  return result;
}

/**
 * Optimize local image URLs in the content using Astro image service
 * @param content
 * @returns 
 */
export function optimizeLocalImageUrls(): ContentProcessor {
  return async ({ content }: NoteWithContent) => {
    return optimizeImage(content);
  }
}

/**
 * Optimize local image downloaded by `downloadImageToLocal` processor
 * @param content 
 * @returns 
 */
export async function optimizeImage(content: string): Promise<string> {
  const $ = cheerio.load(content, {}, false);
  const imgNodes = $('img');
  // The path must be hardcoded for glob to work. Passing variable does not work
  /* @ts-expect-error */
  const importImages = import.meta.glob<{ default: ImageMetadata }>('/src/assets/trilium/**/*')
  for (const imgNode of imgNodes) {
    const $imgNode = $(imgNode);
    const src = $imgNode.attr('src');
    if (!src) continue;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      continue;
    }

    const image = importImages[`${src}`]
    if (!image) {
      console.warn(`Imported image not found for ${src}`)
      continue;
    }

    const optimizedImage: GetImageResult = await getImage({ src: image(), inferSize: true });
    for (const [key, value] of Object.entries(optimizedImage.attributes)) {
      if (key === 'src') continue; // Skip src attribute, we will set it later
      $imgNode.attr(key, value);
    }
    $imgNode.attr('src', optimizedImage.src);
  }
  return $.html();
}