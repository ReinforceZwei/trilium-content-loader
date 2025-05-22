# Trilium Content Loader for Astro

Astro Content Loader to load Trilim notes into Astro Collections.

This is not a full Astro integration library, but a simple content loader that make use of Astro's Content Loader API.

You may also load your trilium notes using plain `fetch()`. This library is just a helper to make things easier.

## Installation

To install the library, run:

```bash
npm install trilium-content-loader
```

## Usage

You will need a server installation of Trilium. Desktop Trilium with server sync is also ok.

First, you need to create an API key in "ETAPI" options. You can find the page in options.

Then, you need to get the note ID of the collection root (i.e. the note that holds all your notes to be loaded)

Here is an example of how to use the library:

```typescript
import { defineCollection, z } from 'astro:content';
import {
  triliumLoader,
  optimizeImageUrls,
  absoluteImageUrls,
  astroCodeBlock,
} from 'trilium-content-loader'

const PostSchema = z.object({
  title: z.string(),
  content: z.string(),
  slug: z.string(),
})

const posts = defineCollection({
  schema: PostSchema,
  loader: triliumLoader<z.infer<typeof PostSchema>>({
    noteId: 'JHCTPqZaBqBl',
    url: import.meta.env.TRILIUM_URL,
    apiKey: import.meta.env.TRILIUM_API_KEY,
    transformEntry(note, content) {
      return {
        title: note.title,
        content: content,
        slug: note.noteId,
      }
    },
    contentProcessor: [
      absoluteImageUrls(),
      optimizeImageUrls(),
      astroCodeBlock(),
    ]
  })
});

export const collections = { posts };
```

### Full config

```typescript
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
   * Slug of the note to load content from. This is optional. If not provided, the noteId will be used.
   * @param note 
   * @returns 
   */
  slug?: (note: Note) => string;
  /**
   * The depth of the content note. Default is 1.
   * For example, 1 mean the content notes are directly under the parent note; 
   * 2 mean there is one more level of notes under the parent note.
   */
  contentNoteDepth?: number;
  /**
   * Load child notes under the content note. Default is `false`.
   * Specify a number as the depth of child notes to load.
   * Set to `true` without providing a number defaults to load 1 level of child notes.
   */
  loadChildNotes?: boolean | number;
  /**
   * Load all parent notes of the content note. Default is `false`
   */
  loadParentNotes?: boolean;
  /**
   * Transform the note entry to a custom schema. This is optional.
   * This is useful if you want to load the content in a specific format.
   * @param note 
   * @returns 
   */
  transformEntry?: (note: Note, content: string) => Schema;
  /**
   * Process the content of the note to better suit for Astro
   */
  contentProcessor?: ContentProcessor[];
}
```

### Content Processor

Content Processor helps you "optimize" your trilium notes so that it is better suit for Astro.

### `absoluteImageUrls()` Processor (Highly recommended to use)

Convert image URL in Trilium note to absolute URL so that the image can be loaded from Astro. **The URL is pointed to shared note** to bypass authentication. It means your notes need to be shared for the image to load.

I haven't find a way to use authentication as Astro image service doesn't expose fetch option to add an authentication header.

### `optimizeImageUrls()` Processor (Highly recommended to use)

Use Astro image service to optimize the images. This processor should run after `absoluteImageUrls()` so that Astro can load the image from your Trilium instance. The images are served from static bundle after building Astro.

### `astroCodeBlock()` Processor (Optional)

Convert your Trilium code block into Astro `<Code />` component with built-in syntax highlight. You can also pass your custom code block component to this processor for custom code block rendering.