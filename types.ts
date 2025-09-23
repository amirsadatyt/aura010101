import type { Part } from "@google/genai";

export interface ImageFile {
  mimeType: string;
  data: string; // base64 encoded
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  attachment?: {
    url: string;
    name: string;
    isImage: boolean;
  }
}

export interface AttachmentFile {
  file: File;
  name: string;
}
