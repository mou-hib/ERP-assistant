import Link from "next/link";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Navbar({ userName }: { userName: string }) {
  return (
    <nav className="navbar">
      <Link href="/" className="wordmark">
        <span className="wordmark-badge">V</span>
        <span className="wordmark-name">VMIND</span>
      </Link>
      <Link href="/compte" className="navbar-user" title="Mon compte">
        <span className="avatar">{initials(userName)}</span>
        <span className="navbar-username">{userName}</span>
      </Link>
    </nav>
  );
}
