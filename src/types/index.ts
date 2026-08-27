// Types partagés de l'application

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

// Lignes de résultats affichées dans le tableau (colonnes dynamiques)
export type TableData = Record<string, unknown>[];

// Réponse du pipeline IA (/api/chat)
export interface ChatResponse {
  answer: string;
  data: TableData;
  title: string;
  count: number;
}
