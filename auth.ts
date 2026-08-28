import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Utilisateur unique codé en dur. Le mot de passe n'est pas documenté ici :
// seul son hash bcrypt est stocké. Demander l'accès au mainteneur du projet.
const ADMIN_USER = {
  id: "1",
  name: "Administrateur",
  email: "admin@erp.com",
  passwordHash: "$2b$10$WXJxXnjltiGTmftMp.HPj.2ZA09NvyuGTOZGi/3.AVwVPD4jcNQ/y",
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Derrière le proxy Vercel, l'URL de base est déduite des en-têtes
  // x-forwarded-* ; sans trustHost, Auth.js retombe sur localhost:3000.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        if (
          email.toLowerCase() === ADMIN_USER.email &&
          bcrypt.compareSync(password, ADMIN_USER.passwordHash)
        ) {
          return { id: ADMIN_USER.id, name: ADMIN_USER.name, email: ADMIN_USER.email };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.loginAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      session.loginAt = (token.loginAt as number) ?? Date.now();
      return session;
    },
  },
});
