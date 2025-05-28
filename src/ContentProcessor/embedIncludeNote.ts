import type { ContentProcessorConfig, ContentProcessor } from "../types.js";
import * as cheerio from 'cheerio';

/**
 * Process note embed/include sections in the content.
 * Replaces include-note sections with the actual note content.
 */
export function embedIncludeNote(config?: {
  /**
   * List of content processors to apply for the embedded notes.
   */
  contentProcessor?: ContentProcessor[];
}): ContentProcessor {
  const { contentProcessor = [] } = config || {};

  async function processContent(content: string, config: ContentProcessorConfig) {
    if (!content) return content;
    if (!contentProcessor || !contentProcessor.length) {
      return content;
    }

    let modifiedContent = content;
    for (const processor of contentProcessor) {
      modifiedContent = await processor(modifiedContent, config);
    }
    return modifiedContent;
  }

  return async (content: string, config: ContentProcessorConfig) => {
    const { api } = config;
    const $ = cheerio.load(content);

    const includeSections = $('section.include-note');
    for (const section of includeSections) {
      const $section = $(section);
      const noteId = $section.attr('data-note-id');
      if (!noteId) continue;

      try {
        // Get the note using the API
        const note = await api.getNote(noteId);
        if (!note) continue;

        // Replace the section content with the note content from noteContent
        const noteContent = await api.getNoteContent(noteId);
        if (noteContent) {
          $section.html(await processContent(noteContent, config));
        }
      } catch (error) {
        console.warn(`Failed to embed note content for note ${noteId}:`, error);
        // Keep the section but add an error class
        $section.addClass('include-note-error');
      }
    }

    return $.html();
  };
}