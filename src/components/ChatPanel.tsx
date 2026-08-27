"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types";

const SUGGESTIONS = [
  "Produits en rupture de stock",
  "Chiffre d'affaires du mois dernier",
  "Solde de la facture Dupont",
];

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (question: string) => void;
}

export default function ChatPanel({ messages, isLoading, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Défilement automatique vers le dernier message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    const question = input.trim();
    if (question.length < 3) {
      setInputError("Veuillez saisir une question.");
      return;
    }
    setInputError(null);
    onSend(question);
    setInput("");
  }

  function fillSuggestion(text: string) {
    setInput(text);
    setInputError(null);
    inputRef.current?.focus();
  }

  return (
    <section className="chat-panel">
      <div className="panel-header">Assistant</div>

      {/* Historique des messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`msg-row${message.role === "user" ? " msg-row--user" : ""}`}
          >
            <div
              className={`msg-bubble ${
                message.role === "user"
                  ? "msg-bubble--user"
                  : "msg-bubble--assistant"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Indicateur de saisie */}
        {isLoading && (
          <div className="msg-row">
            <div className="msg-bubble msg-bubble--assistant typing" aria-label="L'assistant écrit…">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="suggestions">
        <span className="suggestions-label">Essayez aussi</span>
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            type="button"
            className="chip"
            disabled={isLoading}
            onClick={() => fillSuggestion(text)}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Zone de composition */}
      <form className="composer" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="composer-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setInputError(null);
          }}
          disabled={isLoading}
          placeholder="Posez votre question en français…"
        />
        <button
          type="submit"
          className="composer-send"
          disabled={isLoading || input.trim() === ""}
          aria-label="Envoyer"
        >
          ➤
        </button>
        {inputError && (
          <p className="composer-error" role="alert">
            {inputError}
          </p>
        )}
      </form>
    </section>
  );
}
