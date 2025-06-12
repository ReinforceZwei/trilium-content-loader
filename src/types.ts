import { LoaderContext } from "astro/loaders";
import { TriliumApi } from "TriliumApi.js";
import { z } from "zod";
export type TriliumLoaderOptions<Schema = any> = {
  /**
   * The URL of the Trilium server. This is required.
   * @example 'http://localhost:8080'
   */
  url: string;
  /**
   * The API key for the Trilium ETAPI. This is required. Create API key in your Trilium settings.
   * @example 'your-api-key'
   */
  apiKey: string;
  /**
   * The note ID of the parent note to load content from. This is required.
   * @example 'JHCTPqZaBqBl'
   */
  noteId: string;
  /**
   * The depth of the content note. Default is 1.
   * For example, 1 mean the content notes are directly under the parent note; 
   * 2 mean there is one more level of notes under the parent note.
   */
  contentNoteDepth?: number;
  /**
   * Load all parent notes of the content note. Default is `false`
   */
  loadParentNotes?: boolean;
  /**
   * Transform the note entry to a custom schema. This is optional.
   * This is useful if you want to load the content in a specific format.
   * The function can be either synchronous or asynchronous.
   * @param note The note object to transform
   * @param content The content of the note
   * @returns The transformed schema or a Promise of the transformed schema
   */
  transformEntry?: (note: Note, content: string) => Schema | Promise<Schema>;
  /**
   * Process the content of the note to better suit for Astro
   */
  contentProcessor?: ContentProcessor[];
}

export type TriliumLoader = {
  name: string;
  load: (context: LoaderContext) => Promise<void>
}

export type ContentProcessorConfig = Pick<TriliumLoaderOptions, 'url' | 'apiKey'> & {
  api: TriliumApi
}
export type ContentProcessor = 
  ((note: NoteWithContent) => string | Promise<string>) |
  ((note: NoteWithContent, config: ContentProcessorConfig) => string | Promise<string>)


// Base schemas for reused types
const EntityId = z.string().regex(/^[a-zA-Z0-9_]{4,32}$/, {
  message: 'EntityId must be 4-32 characters long and contain only letters, numbers, or underscores',
});

const StringId = z.string().regex(/^[a-zA-Z0-9_]{1,32}$/, {
  message: 'StringId must be 1-32 characters long and contain only letters, numbers, or underscores',
});

const EntityIdList = z.array(EntityId);

const LocalDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}[\+\-]\d{4}$/, {
  message: 'LocalDateTime must be in format YYYY-MM-DD HH:mm:ss.SSS±HHMM',
});

const UtcDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}Z$/, {
  message: 'UtcDateTime must be in format YYYY-MM-DD HH:mm:ss.SSSZ',
});

// Branch schema
const BranchSchema = z.object({
  branchId: EntityId,
  noteId: EntityId.readonly().describe('identifies the child note'),
  parentNoteId: EntityId.readonly().describe('identifies the parent note'),
  prefix: z.string(),
  notePosition: z.number().int(),
  isExpanded: z.boolean(),
  utcDateModified: UtcDateTime.readonly(),
}).describe('Branch places the note into the tree, it represents the relationship between a parent note and child note');

// Attachment schema
const AttachmentSchema = z.object({
  attachmentId: EntityId.readonly(),
  ownerId: EntityId.describe('identifies the owner of the attachment, is either noteId or revisionId'),
  role: z.string(),
  mime: z.string(),
  title: z.string(),
  position: z.number().int(),
  blobId: z.string().describe('ID of the blob object which effectively serves as a content hash'),
  dateModified: LocalDateTime.readonly(),
  utcDateModified: UtcDateTime.readonly(),
  utcDateScheduledForErasureSince: UtcDateTime.readonly().optional(),
  contentLength: z.number().int(),
}).describe('Attachment is owned by a note, has title and content');

// CreateAttachment schema
const CreateAttachmentSchema = z.object({
  ownerId: EntityId.describe('identifies the owner of the attachment, is either noteId or revisionId'),
  role: z.string(),
  mime: z.string(),
  title: z.string(),
  content: z.string(),
  position: z.number().int(),
});

// Attribute schema
const AttributeSchema = z.object({
  attributeId: EntityId,
  noteId: EntityId.readonly().describe('identifies the child note'),
  type: z.enum(['label', 'relation']),
  name: z.string().regex(/^[^\s]+$/, {
    message: 'Name must not contain whitespace',
  }),
  value: z.string(),
  position: z.number().int(),
  isInheritable: z.boolean(),
  utcDateModified: UtcDateTime.readonly(),
}).describe('Attribute (Label, Relation) is a key-value record attached to a note.');

// Note schema
const NoteSchema = z.object({
  noteId: EntityId.readonly(),
  title: z.string(),
  type: z.enum([
    'text',
    'code',
    'render',
    'file',
    'image',
    'search',
    'relationMap',
    'book',
    'noteMap',
    'mermaid',
    'webView',
    'shortcut',
    'doc',
    'contentWidget',
    'launcher',
  ]),
  mime: z.string(),
  isProtected: z.boolean().readonly(),
  blobId: z.string().describe('ID of the blob object which effectively serves as a content hash'),
  attributes: z.array(AttributeSchema).readonly().describe('Reference to AttributeList'),
  parentNoteIds: EntityIdList.readonly(),
  childNoteIds: EntityIdList.readonly(),
  parentBranchIds: EntityIdList.readonly(),
  childBranchIds: EntityIdList.readonly(),
  dateCreated: LocalDateTime,
  dateModified: LocalDateTime.readonly(),
  utcDateCreated: UtcDateTime,
  utcDateModified: UtcDateTime.readonly(),
});

const NoteWithContentSchema = NoteSchema.extend({
  content: z.string(),
})

// NoteWithBranch schema
const NoteWithBranchSchema = z.object({
  note: NoteSchema,
  branch: BranchSchema,
});

// AttributeList schema
const AttributeListSchema = z.array(AttributeSchema);

// SearchResponse schema
const SearchResponseSchema = z.object({
  results: z.array(NoteSchema),
  debugInfo: z.object({}).optional().describe('debugging info on parsing the search query enabled with &debug=true parameter'),
}).strict();

export type Note = z.infer<typeof NoteSchema>;
export type NoteWithContent = z.infer<typeof NoteWithContentSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type Attribute = z.infer<typeof AttributeSchema>;

export {
  EntityId,
  StringId,
  EntityIdList,
  LocalDateTime,
  UtcDateTime,
  NoteSchema,
  NoteWithContentSchema,
  BranchSchema,
  NoteWithBranchSchema,
  AttachmentSchema,
  CreateAttachmentSchema,
  AttributeSchema,
  AttributeListSchema,
  SearchResponseSchema,
};

export interface ApiError {
  status: number;
  code: string;
  message: string;
}