"use client";

import { useEffect, useRef, useState } from "react";
import type { Message } from "@/types";

const SUGGESTIONS = [
  "Produits en rupture de stock",
  "Chiffre d'affaires du mois dernier",
  "Solde de la facture Dupont",
];

const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LEFT JOIN|INNER JOIN|JOIN|ON|LIMIT|LEFT|INNER|AND|OR|AS|COUNT|SUM|AVG|LIKE|IN|NOT|NULL|HAVING|DISTINCT|DESC|ASC)\b/gi;

// Le SQL provient du modèle : il est échappé AVANT toute insertion en HTML,
// sinon une chaîne littérale malveillante deviendrait du balisage exécutable.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightSql(sql: string): string {
  return escapeHtml(sql).replace(
    SQL_KEYWORDS,
    '<span class="sql-kw">$1</span>'
  );
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (question: string) => void;
}

export default function ChatPanel({ messages, isLoading, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  // Identifiants des messages dont la requête SQL est dépliée
  const [openSql, setOpenSql] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleSql(id: string) {
    setOpenSql((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
          <div key={message.id}>
            <div
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

            {/* Requête SQL : uniquement sur les réponses issues de la base
                (ni le message d'accueil, ni les messages d'erreur) */}
            {message.role === "assistant" && message.sql && (
              <>
                <button
                  type="button"
                  className="sql-toggle"
                  onClick={() => toggleSql(message.id)}
                  aria-expanded={!!openSql[message.id]}
                >
                  <span aria-hidden="true">{"{ }"}</span>
                  {openSql[message.id]
                    ? "Masquer la requête SQL"
                    : "Voir la requête SQL"}
                </button>

                {openSql[message.id] && (
                  <pre
                    className="sql-block"
                    dangerouslySetInnerHTML={{
                      __html: highlightSql(message.sql),
                    }}
                  />
                )}
              </>
            )}
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
