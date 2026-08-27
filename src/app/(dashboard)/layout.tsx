import { auth } from "@auth";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="app-shell">
      <Navbar userName={session?.user?.name ?? "Utilisateur"} />
      <main className="app-main">{children}</main>
    </div>
  );
}
