import { auth, signOut } from "@auth";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function ComptePage() {
  const session = await auth();
  const name = session?.user?.name ?? "Utilisateur";
  const email = session?.user?.email ?? "";
  const loginDate = new Date(session?.loginAt ?? Date.now());

  const connectedSince = loginDate.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="account-screen">
      <div className="account-card">
        <div className="account-header">
          <span className="avatar avatar--large">{initials(name)}</span>
          <div>
            <div className="account-name">{name}</div>
            <div className="account-email">{email}</div>
          </div>
        </div>

        <dl>
          <div className="info-row">
            <dt>Rôle</dt>
            <dd>Utilisateur ERP</dd>
          </div>
          <div className="info-row">
            <dt>Connecté depuis</dt>
            <dd>{connectedSince}</dd>
          </div>
          <div className="info-row">
            <dt>Méthode d&apos;authentification</dt>
            <dd>Identifiants (Credentials)</dd>
          </div>
        </dl>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="btn-danger-outline">
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
