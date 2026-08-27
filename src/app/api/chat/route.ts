/**
 * Route POST /api/chat
 * Pipeline IA en 6 étapes :
 * 1. Validation de la question (sécurité, longueur)
 * 2. Génération SQL via Groq (gpt-oss-120b) + schéma BDD
 * 3. Validation SQL (SELECT uniquement, blocklist)
 * 4. Exécution via Prisma ($queryRawUnsafe)
 * 5. Génération réponse française via Groq
 * 6. Retour JSON { answer, data, sql, count }
 */
import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { SYSTEM_PROMPT } from "@/lib/prompt";

// "llama-3.3-70b-versatile" (spécifié initialement) a été retiré par Groq ;
// gpt-oss-120b est le meilleur modèle disponible sur ce compte.
const MODEL = "openai/gpt-oss-120b";

const GROQ_TIMEOUT_MS = 15_000;

// Mots-clés interdits dans le SQL généré (consultation uniquement)
const FORBIDDEN =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b/i;

class GroqTimeoutError extends Error {}

type ChatParams = Parameters<typeof groq.chat.completions.create>[0];

// Appel Groq avec délai maximal de 15 s
async function completeWithTimeout(params: ChatParams) {
  try {
    return await groq.chat.completions.create(
      { ...params, stream: false },
      { signal: AbortSignal.timeout(GROQ_TIMEOUT_MS) }
    );
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (
      name === "TimeoutError" ||
      name === "AbortError" ||
      name === "APIUserAbortError"
    ) {
      throw new GroqTimeoutError();
    }
    throw err;
  }
}

const TIMEOUT_RESPONSE = () =>
  NextResponse.json(
    { error: "La réponse prend trop de temps. Veuillez réessayer." },
    { status: 504 }
  );

// Convertit les valeurs non sérialisables (BigInt renvoyé par SQLite
// pour les agrégats) avant JSON.stringify
function sanitizeRows(rows: unknown): Record<string, unknown>[] {
  return JSON.parse(
    JSON.stringify(rows, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );
}

export async function POST(req: Request) {
  // ÉTAPE 1 — Lire la question
  let question: unknown;
  try {
    ({ question } = await req.json());
  } catch {
    question = undefined;
  }

  if (typeof question !== "string" || question.trim().length < 3) {
    return NextResponse.json(
      { error: "Je n'ai pas compris votre question. Pouvez-vous la reformuler ?" },
      { status: 400 }
    );
  }

  // ÉTAPE 2 — Générer le SQL via Groq
  // La date du jour est injectée pour que les dates relatives
  // ("mois dernier", "cette semaine") soient résolues correctement.
  let sql: string;
  try {
    const completion = await completeWithTimeout({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            SYSTEM_PROMPT + `\nLa date d'aujourd'hui est: ${new Date().toISOString()}`,
        },
        { role: "user", content: question },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    sql = (completion.choices[0]?.message?.content ?? "").trim();
    // Retire d'éventuelles clôtures markdown malgré la consigne
    sql = sql.replace(/^```(?:sql)?\s*/i, "").replace(/\s*```$/, "").trim();
  } catch (err) {
    if (err instanceof GroqTimeoutError) return TIMEOUT_RESPONSE();
    console.error("[/api/chat] Erreur Groq (génération SQL) :", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }

  // ÉTAPE 3 — Valider le SQL (SELECT uniquement, aucun mot-clé d'écriture)
  if (!/^SELECT\b/i.test(sql) || FORBIDDEN.test(sql)) {
    return NextResponse.json(
      { error: "Je ne peux répondre qu'à des questions de consultation." },
      { status: 400 }
    );
  }

  // ÉTAPE 4 — Exécuter le SQL via Prisma
  let rows: Record<string, unknown>[];
  try {
    const result = await prisma.$queryRawUnsafe(sql);
    rows = sanitizeRows(result);
  } catch (err) {
    console.error("[/api/chat] Échec d'exécution SQL :", err);
    return NextResponse.json(
      { error: "Je n'ai pas pu récupérer les données. Reformulez votre question." },
      { status: 500 }
    );
  }

  // Aucun résultat : réponse directe, sans second appel au modèle
  if (rows.length === 0) {
    return NextResponse.json({
      answer: "Aucun résultat trouvé pour votre question.",
      data: rows,
      sql,
      count: 0,
    });
  }

  // ÉTAPE 5 — Rédiger la réponse en français via Groq
  let answer: string;
  try {
    const completion = await completeWithTimeout({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant ERP. Tu reçois une question en français et des données brutes. Tu rédiges une réponse claire et concise en français. Une ou deux phrases maximum. Pas de markdown. Pas de listes.",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nDonnées: ${JSON.stringify(rows)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    answer = (completion.choices[0]?.message?.content ?? "").trim();
  } catch (err) {
    if (err instanceof GroqTimeoutError) return TIMEOUT_RESPONSE();
    console.error("[/api/chat] Erreur Groq (rédaction) :", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }

  // ÉTAPE 6 — Réponse finale
  return NextResponse.json({
    answer,
    data: rows,
    sql,
    count: rows.length,
  });
}
