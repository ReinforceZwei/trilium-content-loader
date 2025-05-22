# Trilium Content Loader for Astro

Astro Content Loader to load Trilim notes into Astro Collections.

## Installation

To install the library, run:

```bash
npm install trilium-content-loader
```

## Usage

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
