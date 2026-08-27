"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(true);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="wordmark">
          <span className="wordmark-badge">V</span>
          <span className="wordmark-name">VMIND</span>
        </div>

        <p className="login-subtitle">
          Connectez-vous pour interroger vos données ERP.
        </p>

        {error && (
          <p className="form-error" role="alert">
            Adresse e-mail ou mot de passe incorrect. Vérifiez vos identifiants
            et réessayez.
          </p>
        )}

        <label htmlFor="email" className="field-label">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="admin@erp.com"
        />

        <label htmlFor="password" className="field-label">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="••••••••"
        />

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
