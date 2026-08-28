// Types partagés de l'application

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  // Requête SQL ayant produit la réponse (absente sur le message d'accueil
  // et sur les messages d'erreur)
  sql?: string;
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
