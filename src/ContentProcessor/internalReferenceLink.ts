import type { ContentProcessorConfig, ContentProcessor, Note } from "../types.js";
import * as cheerio from 'cheerio';

/**
 * Convert Trilium internal reference links to URL.
 * Your linked note should be public accessible with a URL. 
 * This processor do not handle that part for you
 * @param config 
 * @returns 
 */
export function internalReferenceLink(config: {
  /**
   * The public accessible URL of the linked note. 
   * Return `null` will remove the link and keep the link text
   * @param note 
   * @returns 
   */
  getUrl: (note: Note) => string | null;
}): ContentProcessor {
  const { getUrl } = config;
  return async (content: string, config: ContentProcessorConfig) => {
    const { api } = config;
    const $ = cheerio.load(content);

    const referenceLinks = $('a.reference-link');
    for (const link of referenceLinks) {
      const $link = $(link);
      const href = $link.attr('href');
      if (!href) continue;

      // Extract the note ID from the href (last segment after '/')
      const noteId = href.split('/').pop();
      if (!noteId) continue;

      try {
        // Get the note using the API
        const note = await api.getNote(noteId);
        if (!note) continue;

        // Replace the href with the new URL or remove the link
        const newUrl = getUrl(note);
        if (newUrl === null) {
          $link.replaceWith($link.text()); // Replace link with its text content
        } else {
          $link.attr('href', newUrl);
        }
      } catch (error) {
        console.warn(`Failed to process reference link for note ${noteId}:`, error);
      }
    }

    return $.html();
  };
}