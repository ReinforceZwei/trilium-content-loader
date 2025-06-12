import { promises as fs } from 'fs';
import { existsSync } from 'fs'
import path from 'path';
import type { ContentProcessor, ContentProcessorConfig, NoteWithContent } from "../types.js";
import * as cheerio from 'cheerio';
/* @ts-expect-error */
import { getImage } from "astro:assets";

interface DownloadImageToLocalConfig {
  skipDownloadIfExist?: boolean;
}

/**
 * Downloads images from Trilium and stores them locally
 */
export function downloadImageToLocal(config?: DownloadImageToLocalConfig): ContentProcessor {
  const {
    skipDownloadIfExist = true,
  } = config || {};

  return async (note: NoteWithContent, config: ContentProcessorConfig) => {
    const api = config.api;
    const { content } = note;

    // The path must be hardcoded for optimize image to work
    const imageDir = 'src/assets/trilium'

    const attachments = await api.getNoteAttachments(note.noteId);

    const $ = cheerio.load(content, {}, false);
    const imgNodes = $('img');
    for (const imgNode of imgNodes) {
      const $imgNode = $(imgNode);
      const src = $imgNode.attr('src');
      if (!src) continue;
      
      // Skip if it's external URL or local path
      if (src.startsWith('http://') || src.startsWith('https://') || !src.includes('/attachments/')) {
        continue;
      }

      try {
        // Extract attachment ID from the URL pattern: api/attachments/{attachmentId}/...
        const attachmentId = src.split('/attachments/')[1]?.split('/')[0];
        if (!attachmentId) {
          console.error(`Could not extract attachment ID from ${src}`);
          continue;
        }

        // Check if this attachment exists in the note's attachments
        let attachment = attachments.find(a => a.attachmentId === attachmentId);
        if (!attachment) {
          // Cannot find attachment, maybe is from embedded note
          attachment = await api.getAttachment(attachmentId);
        }

        const localFilePath = path.join(imageDir, attachment.blobId, attachment.title);
        if (!skipDownloadIfExist || !existsSync(path.join(imageDir, attachment.blobId))) {
          const imageData = await api.getAttachmentContent(attachmentId);
          
          await fs.mkdir(path.join(imageDir, attachment.blobId), { recursive: true });
          await fs.writeFile(localFilePath, imageData);
        }
        
        // Replace URL with local path
        const newPath = `/${localFilePath.replace(/\\/g, '/')}`;
        $imgNode.attr('src', newPath);
      } catch (error) {
        console.error(`Failed to download image ${src}:`, error);
      }
    }
    
    return $.html();
  };
}