export enum ChatMessageRole {
  USER = 'user',
  MODEL = 'model',
}

export type Engine = 'bapkam' | 'deepsingh';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  sources?: GroundingSource[];
  modelSources?: string[];
  attachment?: {
    url: string;
    type: 'image';
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}
