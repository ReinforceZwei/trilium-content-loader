import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { Code } from 'astro/components';
import * as cheerio from 'cheerio';
import type { ContentProcessor, NoteWithContent } from "../types.js";

// This regex cannot cover all cases
// Full language list of trilium at 
// https://github.com/TriliumNext/Notes/blob/develop/packages/commons/src/lib/mime_type.ts
const LANGUAGE_REGEX = /(?:application|text)-(?:x-)?(.+)/;

function getLanguageFromClass(className?: string): string {
  if (!className) {
    return 'text';
  }
  const match = className.match(LANGUAGE_REGEX);
  if (match) {
    if (match[1].startsWith('javascript')) {
      // full match looks like 'javascript-env-backend' or 'javascript-env-frontend'
      return 'javascript';
    }
    if (match[1] === 'c-src') {
      return 'c';
    }
    return match[1];
  }
  return 'text';
}

/**
 * Convert code blocks in the content to Astro components. Default component is Astro `<Code />`
 * @param options Specify custom Astro component to render code blocks.
 * @returns 
 */
export function astroCodeBlock(options?: AstroCodeBlockOptions): ContentProcessor {
  const {
    component = Code,
    componentProps = (code: string, language: string) => ({ code, lang: language })
  } = options || {};
  return async ({ content }: NoteWithContent) => {
    const container = await AstroContainer.create();
    const $ = cheerio.load(content);
    const codeBlocks = $('pre > code');
    for (const element of codeBlocks.toArray()) {
      const codeElement = $(element);
      const preElement = codeElement.parent();
      const codeContent = codeElement.text();
      const language = getLanguageFromClass(codeElement.attr('class'));
      const props = componentProps(codeContent, language);
      const newElement = await container.renderToString(component, { props });
      preElement.replaceWith(newElement);
    }
    return $.html()
  }
}

export type AstroCodeBlockOptions = {
  component?: any
  componentProps?: (code: string, language: string) => Record<string, any>
}