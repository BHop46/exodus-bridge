export interface ParsedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ParsedConversation {
  id: string;
  title: string;
  createTime: number;
  messages: ParsedMessage[];
  messageCount: number;
}

// Raw ChatGPT JSON types (subset)
export interface RawNode {
  id: string;
  message?: {
    id: string;
    author: { role: string };
    create_time: number;
    content: { parts: string[] };
  } | null;
  parent?: string | null;
  children: string[];
}

export interface RawMapping {
  [key: string]: RawNode;
}

export interface RawConversation {
  id: string;
  title: string;
  create_time: number;
  mapping: RawMapping;
  current_node: string | null;
}

export interface PersonaAnalysis {
  tone: string;
  keywords: string[];
  suggestedPrompt: string;
  isAiGenerated: boolean;
}

export type TargetPlatform = 'Gemini' | 'Grok' | 'Claude';

export interface MigrationChunk {
  filename: string;
  content: string;
  partNumber: number;
  totalParts: number;
}