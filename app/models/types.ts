export interface AIModel {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface DebateMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface DebateSession {
  topic: string;
  rounds: number;
  currentRound: number;
  messages: DebateMessage[];
  ai1: AIModel;
  ai2: AIModel;
  isComplete: boolean;
} 