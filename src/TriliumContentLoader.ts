import type { LoaderContext } from 'astro/loaders';
import type { TriliumLoaderOptions, Note, TriliumLoader } from './types.js';
import { TriliumApi } from './TriliumApi.js';

const getDefaultSlug = (note: Note) => note.noteId;

export function triliumLoader<Schema extends Record<string, unknown> = any>(
  options: TriliumLoaderOptions<Schema>
): TriliumLoader {
  const {
    url,
    apiKey,
    noteId,
    contentNoteDepth = 1,
    loadParentNotes = false,
  } = options;

  const api = new TriliumApi(url, apiKey);

  interface NoteWithDepth {
    note: Note;
    depth: number;
  }

  async function loadChildNotesRecursively(
    parentNote: Note,
    maxDepth: number = 1
  ): Promise<NoteWithDepth[]> {
    const allNotes: NoteWithDepth[] = [];
    
    async function loadNotes(note: Note, currentDepth: number): Promise<void> {
      for (const childNoteId of note.childNoteIds) {
        const childNote = await api.getNote(childNoteId);
        allNotes.push({ note: childNote, depth: currentDepth });
        
        // Recursively load child notes
        if (currentDepth < maxDepth)
          await loadNotes(childNote, currentDepth + 1);
      }
    }

    await loadNotes(parentNote, 1);
    return allNotes;
  }

  async function processContent(content: string) {
    if (!content) return content;
    if (!options.contentProcessor || !options.contentProcessor.length) {
      return content;
    }

    let modifiedContent = content;
    for (const processor of options.contentProcessor) {
      modifiedContent = await processor(modifiedContent, { url, apiKey, api });
    }
    return modifiedContent;
  }

  async function processAndStoreNote(
    note: Note,
    context: LoaderContext,
  ) {
    const { transformEntry, slug } = options;
    const { store } = context;
    const content = await api.getNoteContent(note.noteId);
    const processedContent = await processContent(content);
    
    const baseData = {
      ...note,
      slug: slug ? slug(note) : getDefaultSlug(note),
      content: processedContent,
    };

    const data = transformEntry ? transformEntry(note, processedContent) : (baseData as unknown as Schema);

    const parsedData = await context.parseData({
      id: baseData.slug,
      data
    });

    store.set({
      id: baseData.slug,
      data: parsedData,
      digest: context.generateDigest(parsedData),
      body: processedContent,
    });
  }

  return {
    name: 'trilium',
    load: async (context: LoaderContext) => {
      const rootNote = await api.getNote(noteId);

      let maxDepth = contentNoteDepth;
      let childNotes = await loadChildNotesRecursively(rootNote, maxDepth);
      if (!loadParentNotes) {
        childNotes = childNotes.filter(note => note.depth === contentNoteDepth);
      }
      for (const { note: childNote } of childNotes) {
        await processAndStoreNote(childNote, context);
      }
    }
  };
}