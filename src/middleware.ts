import { auth } from "@auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // La page de connexion : rediriger vers l'accueil si déjà connecté
  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/", req.nextUrl));
    }
    return;
  }

  // Toutes les autres routes sont protégées
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  // Tout sauf /api/auth/*, les fichiers statiques et le favicon
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
