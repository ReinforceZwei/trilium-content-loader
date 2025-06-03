import type { Note, ApiError, Attachment } from './types.js';

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

  async getNoteAttachments(noteId: string): Promise<Attachment[]> {
    const url = `${this.baseUrl}/etapi/notes/${noteId}/attachments`;
    const options = { method: 'GET', headers: { authorization: this.apiKey } };
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`Failed to fetch note attachments: ${error.message}: ${error.status}`);
    }
    return await response.json();
  }

  async getAttachment(attachmentId: string): Promise<Attachment> {
    const url = `${this.baseUrl}/etapi/attachments/${attachmentId}`;
    const options = { method: 'GET', headers: { authorization: this.apiKey } };
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`Failed to fetch attachment: ${error.message}: ${error.status}`);
    }
    return await response.json();
  }

  async getAttachmentContent(attachmentId: string): Promise<Buffer> {
    const url = `${this.baseUrl}/etapi/attachments/${attachmentId}/content`;
    const options = { method: 'GET', headers: { authorization: this.apiKey } };
    const response = await fetch(url, options);
    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(`Failed to fetch note attachments: ${error.message}: ${error.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}