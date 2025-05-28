import type { Note, ApiError } from './types.js';

export class TriliumApi {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async getNote(noteId: string): Promise<Note> {
    const url = `${this.baseUrl}/etapi/notes/${noteId}`;
    const options = { method: 'GET', headers: { authorization: this.apiKey } };
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`Failed to fetch note: ${error.message}: ${error.status}`);
    }
    return await response.json();
  }

  async getNoteContent(noteId: string): Promise<string> {
    const url = `${this.baseUrl}/etapi/notes/${noteId}/content`;
    const options = { method: 'GET', headers: { authorization: this.apiKey } };
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`Failed to fetch note content: ${error.message}: ${error.status}`);
    }
    return await response.text();
  }
}