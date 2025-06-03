import { ContentProcessor, ContentProcessorConfig, NoteWithContent } from "types.js";

export { absoluteImageUrls } from "./absoluteImageUrl.js";
export { optimizeRemoteImageUrls, optimizeLocalImageUrls, optimizeImage, optimizeRemoteImage } from "./optimizeImage.js";
export { astroCodeBlock } from "./astroCodeBlock.js";
export { internalReferenceLink } from "./internalReferenceLink.js"
export { embedIncludeNote } from "./embedIncludeNote.js"
export { downloadImageToLocal } from "./downloadImageToLocal.js"

interface ProcessContentContext {
  processor: ContentProcessor[],
  config: ContentProcessorConfig,
}
export async function processContent(note: NoteWithContent, context: ProcessContentContext) {
  const { processor: contentProcessor, config } = context;
  const { content } = note;
  if (!content) return content;
  if (!contentProcessor || !contentProcessor.length) {
    return content;
  }

  let modifiedNote = note;
  for (const processor of contentProcessor) {
    try {
      modifiedNote.content = await processor(modifiedNote, config);
    } catch (error) {
      console.warn(`Content processor failed: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with the next processor using the current content
    }
  }
  return modifiedNote.content;
}