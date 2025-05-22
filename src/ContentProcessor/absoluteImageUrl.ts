import type { ContentProcessorConfig, ContentProcessor } from "../types.js";

/**
 * Replace image relative URLs with shared Trilium URLs.
 * @param content 
 * @param config 
 * @returns 
 */
export function absoluteImageUrls(): ContentProcessor {
  const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
  return (content: string, config: ContentProcessorConfig) => {
    let result = content;
    for (const match of content.matchAll(regex)) {
      const [fullMatch, src] = match;
      // If the URL is already absolute (starts with http:// or https://), leave it as is
      if (src.startsWith('http://') || src.startsWith('https://')) {
        continue;
      }
      // Replace relative URL with shared Trilium URL
      const sharedUrl = `${config.url}/share/${src}`;
      result = result.replace(fullMatch, fullMatch.replace(src, sharedUrl));
    }
    return result;
  }
}