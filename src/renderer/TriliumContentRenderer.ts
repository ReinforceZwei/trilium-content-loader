import { TriliumApi } from '../TriliumApi.js';
import type { CreateRendererConfig } from './types.js';
import { processContent } from '../ContentProcessor/index.js'
import { Note } from '../types.js';

export function createTriliumContentRenderer(config: CreateRendererConfig) {
  const { url, apiKey, contentProcessor = [] } = config;
  const api = new TriliumApi(url, apiKey)
  const contentProcessorConfig = {
    url,
    api,
    apiKey
  }

  return async (content: string, note: Note): Promise<string> => {
    const processed = await processContent({ ...note, content }, {
      processor: contentProcessor,
      config: contentProcessorConfig
    })
    return processed;
  }
}