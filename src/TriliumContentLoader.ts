import type { Loader, LoaderContext } from 'astro/loaders';
import type { TriliumLoaderOptions, Note, ApiError, TriliumLoader } from './types.js';

const getDefaultSlug = (note: Note) => note.noteId;

async function getNote(baseUrl: string, apiKey: string, noteId: string): Promise<Note> {
  const url = `${baseUrl}/etapi/notes/${noteId}`;
  const options = { method: 'GET', headers: { authorization: apiKey } };
  const response = await fetch(url, options);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(`Failed to fetch note: ${error.message}: ${error.status}`);
  }
  return await response.json();
}

async function getNoteContent(baseUrl: string, apiKey: string, noteId: string): Promise<string> {
  const url = `${baseUrl}/etapi/notes/${noteId}/content`;
  const options = { method: 'GET', headers: { authorization: apiKey } };
  const response = await fetch(url, options);
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(`Failed to fetch note content: ${error.message}: ${error.status}`);
  }
  return await response.text();
}


interface NoteWithDepth {
  note: Note;
  depth: number;
}

async function loadChildNotesRecursively(
  url: string,
  apiKey: string,
  parentNote: Note,
  maxDepth: number = 1
): Promise<NoteWithDepth[]> {
  const allNotes: NoteWithDepth[] = [];
  
  async function loadNotes(note: Note, currentDepth: number): Promise<void> {
    for (const childNoteId of note.childNoteIds) {
      const childNote = await getNote(url, apiKey, childNoteId);
      allNotes.push({ note: childNote, depth: currentDepth });
      
      // Recursively load child notes
      if (currentDepth < maxDepth)
        await loadNotes(childNote, currentDepth + 1);
    }
  }

  await loadNotes(parentNote, 1);
  return allNotes;
}

async function processAndStoreNote(
  note: Note,
  context: LoaderContext,
  options: TriliumLoaderOptions,
) {
  const { url, apiKey, transformEntry, slug } = options;
  const { store } = context;
  const content = await getNoteContent(url, apiKey, note.noteId);
  const processedContent = await processContent(content, options);
  
  const data = {
    ...note,
    slug: slug ? slug(note) : getDefaultSlug(note),
    content: processedContent,
  };

  const parsedData = await context.parseData({
    id: data.slug,
    data: transformEntry ? transformEntry(note, processedContent) : data,
  });

  store.set({
    id: data.slug,
    data: parsedData,
    digest: context.generateDigest(parsedData),
    body: processedContent,
  });
}

async function processContent(content: string, options: TriliumLoaderOptions) {
  if (!content) return content;
  if (!options.contentProcessor || !options.contentProcessor.length) {
    return content;
  }

  let modifiedContent = content;
  for (const processor of options.contentProcessor) {
    modifiedContent = await processor(modifiedContent, { url: options.url, apiKey: options.apiKey });
  }
  return modifiedContent;
}

export function triliumLoader<Schema = any>(options: TriliumLoaderOptions<Schema>): TriliumLoader {
  const {
    url,
    apiKey,
    noteId,
    slug = getDefaultSlug,
    contentNoteDepth = 1,
    loadChildNotes = false,
    loadParentNotes = false,
    transformEntry,
  } = options;

  return {
    name: 'trilium',
    load: async (context: LoaderContext) => {
      const rootNote = await getNote(url, apiKey, noteId);

      let maxDepth = contentNoteDepth;
      if (loadChildNotes) {
        if (typeof loadChildNotes === 'number') {
          maxDepth += loadChildNotes
        } else {
          maxDepth += 1;
        }
      }
      const childNotes = await loadChildNotesRecursively(url, apiKey, rootNote, maxDepth);
      for (const { note: childNote } of childNotes) {
        await processAndStoreNote(childNote, context, options);
      }
    }
  };
}