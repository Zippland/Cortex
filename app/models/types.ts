export interface AIModel {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  preferences: string[];
  stance: {
    progressive: number;
    analytical: number;
    emotional: number;
    risktaking: number;
  };
}

export interface DebateMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface DebateSession {
  topic: string;
  currentRound: number;
  messages: DebateMessage[];
  ai1: AIModel;
  ai2: AIModel;
  referee?: AIModel;
  isComplete: boolean;
  ai1Notebook: string;
  ai2Notebook: string;
  refereeNotebook?: string;
  lastNotebookUpdateCount: number;
  userConfirmationNeeded: boolean;
} 