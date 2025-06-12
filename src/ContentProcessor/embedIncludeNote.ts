import type { ContentProcessorConfig, ContentProcessor, NoteWithContent } from "../types.js";
import * as cheerio from 'cheerio';
import { processContent } from "./index.js";

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

  return async (note: NoteWithContent, config: ContentProcessorConfig) => {
    const { api } = config;
    const $ = cheerio.load(note.content, {}, false);

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
        const content = await api.getNoteContent(noteId);
        const noteWithContent: NoteWithContent = { ...note, content }
        if (content) {
          $section.html(await processContent(noteWithContent, {
            processor: contentProcessor,
            config: config,
          }));
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