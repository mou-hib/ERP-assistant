import Groq from "groq-sdk";

/**
 * Client Groq partagé par les routes API (côté serveur uniquement).
 * La clé est lue depuis la variable d'environnement GROQ_API_KEY.
 */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
