"use client";

import { useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import DataTable from "@/components/DataTable";
import type { Message, TableData } from "@/types";

// Premier message de l'assistant, toujours affiché
const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis l'assistant VMIND. Posez-moi une question sur vos clients, commandes, produits, factures ou paiements.",
  timestamp: new Date(),
};

function assistantMessage(content: string): Message {
  return { id: crypto.randomUUID(), role: "assistant", content, timestamp: new Date() };
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TableData | null>(null);
  const [title, setTitle] = useState("Données");

  async function handleSend(question: string) {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // L'historique courant (avant la nouvelle question) est transmis :
      // le serveur n'en garde que les 4 derniers messages comme contexte.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const payload = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { ...assistantMessage(payload.answer), sql: payload.sql },
        ]);
        setData(payload.data);
        const firstRow = payload.data?.[0];
        setTitle(
          firstRow && Object.keys(firstRow).length > 0
            ? Object.keys(firstRow)[0].charAt(0).toUpperCase() +
                Object.keys(firstRow)[0].slice(1)
            : "Résultats"
        );
      } else {
        setMessages((prev) => [
          ...prev,
          assistantMessage(
            payload.error ?? "Une erreur est survenue. Veuillez réessayer."
          ),
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        assistantMessage("Une erreur est survenue. Veuillez réessayer."),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="dashboard-grid">
      <ChatPanel messages={messages} isLoading={isLoading} onSend={handleSend} />
      <DataTable data={data} title={title} />
    </div>
  );
}
