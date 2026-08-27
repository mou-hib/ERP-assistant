import { DefaultSession } from "next-auth";

// La session contient l'id de l'utilisateur et l'horodatage de connexion
// (ajoutés dans les callbacks jwt/session)
declare module "next-auth" {
  interface Session {
    loginAt: number;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
