// @ts-ignore
import { getImage } from "astro:assets";
import type { ContentProcessor } from "../types.js";

/**
 * Optimize image URLs in the content using Astro image service
 * @param content
 * @returns 
 */
export function optimizeImageUrls(): ContentProcessor {
  const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  return async (content: string) => {
    let result = content;
    for (const match of content.matchAll(regex)) {
      const [fullMatch, src] = match;
      const optimizedUrl = await getImage({ src, inferSize: true });
      result = result.replace(fullMatch, fullMatch.replace(src, optimizedUrl.src));
    }
    return result;
  }
}