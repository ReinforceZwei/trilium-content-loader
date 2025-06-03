import { ContentProcessor } from "../types.js";

export type CreateRendererConfig = {
  url: string;
  apiKey: string;
  contentProcessor?: ContentProcessor[];
}