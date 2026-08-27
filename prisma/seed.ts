import { PrismaClient, StatutCommande, ModePaiement } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Connexion à Turso via l'adaptateur libSQL (les variables viennent du .env,
// chargé automatiquement par `npx prisma db seed`)
const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const prisma = new PrismaClient({ adapter });

// Date de référence : les commandes sont réparties sur les 3 derniers mois
const NOW = new Date();

function daysAgo(days: number, hour = 10): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  // Nettoyage (ordre inverse des dépendances)
  await prisma.paiement.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.ligneCommande.deleteMany();
  await prisma.commande.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.client.deleteMany();

  // ─── 12 clients français ───────────────────────────────────────────────
  const clients = await Promise.all(
    [
      { nom: "Sophie Martin", email: "sophie.martin@orange.fr", telephone: "06 12 45 78 90" },
      { nom: "Julien Bernard", email: "julien.bernard@gmail.com", telephone: "06 23 56 89 01" },
      { nom: "Camille Dubois", email: "camille.dubois@wanadoo.fr", telephone: "07 34 67 90 12" },
      { nom: "Marc Dupont", email: "marc.dupont@free.fr", telephone: "06 45 78 01 23" },
      { nom: "Émilie Durand", email: "emilie.durand@gmail.com", telephone: "07 56 89 12 34" },
      { nom: "Nicolas Leroy", email: "nicolas.leroy@sfr.fr", telephone: "06 67 90 23 45" },
      { nom: "Claire Moreau", email: "claire.moreau@laposte.net", telephone: "07 78 01 34 56" },
      { nom: "Antoine Fournier", email: "antoine.fournier@gmail.com", telephone: "06 89 12 45 67" },
      { nom: "Laura Girard", email: "laura.girard@hotmail.fr", telephone: "07 90 23 56 78" },
      { nom: "Maxime Rousseau", email: "maxime.rousseau@orange.fr", telephone: "06 01 34 67 89" },
      { nom: "Nadia Benali", email: "nadia.benali@gmail.com", telephone: "07 12 45 78 90" },
      { nom: "Pierre Lefèvre", email: "pierre.lefevre@yahoo.fr", telephone: "06 34 56 78 91" },
    ].map((data) => prisma.client.create({ data }))
  );

  // ─── 18 produits (bureautique, informatique, mobilier, fournitures) ────
  const produits = await Promise.all(
    [
      // Bureautique
      { nom: "Imprimante laser HP LaserJet Pro", description: "Bureautique — imprimante laser monochrome 30 ppm, recto-verso automatique", prix: 249.9, stock: 15 },
      { nom: "Destructeur de documents Fellowes", description: "Bureautique — destructeur coupe croisée, 12 feuilles, sécurité P-4", prix: 129.0, stock: 8 },
      { nom: "Vidéoprojecteur Epson EB-W52", description: "Bureautique — vidéoprojecteur WXGA 4000 lumens pour salle de réunion", prix: 549.0, stock: 0 },
      { nom: "Tableau blanc magnétique 120x90", description: "Bureautique — tableau blanc émaillé magnétique avec porte-marqueurs", prix: 89.9, stock: 22 },
      // Informatique
      { nom: "Ordinateur portable Dell Latitude 5540", description: "Informatique — PC portable 15,6\" i5, 16 Go RAM, SSD 512 Go", prix: 1149.0, stock: 12 },
      { nom: "Écran Dell 27\" QHD", description: "Informatique — moniteur 27 pouces QHD IPS, pied réglable en hauteur", prix: 329.0, stock: 18 },
      { nom: "Clavier sans fil Logitech MX Keys", description: "Informatique — clavier sans fil rétroéclairé AZERTY", prix: 109.9, stock: 30 },
      { nom: "Souris Logitech MX Master 3S", description: "Informatique — souris ergonomique sans fil, 8000 DPI", prix: 99.9, stock: 0 },
      { nom: "Station d'accueil USB-C Dell WD22TB4", description: "Informatique — dock Thunderbolt 4, double écran 4K, 90 W", prix: 279.0, stock: 7 },
      { nom: "Disque SSD externe Samsung T7 1 To", description: "Informatique — SSD portable USB 3.2, 1050 Mo/s", prix: 119.0, stock: 25 },
      // Mobilier
      { nom: "Bureau réglable en hauteur 160x80", description: "Mobilier — bureau assis-debout électrique, plateau chêne", prix: 499.0, stock: 6 },
      { nom: "Fauteuil ergonomique Ergotron", description: "Mobilier — fauteuil de bureau ergonomique, soutien lombaire réglable", prix: 389.0, stock: 0 },
      { nom: "Caisson de rangement 3 tiroirs", description: "Mobilier — caisson mobile métallique avec serrure", prix: 149.0, stock: 14 },
      { nom: "Armoire haute à rideaux", description: "Mobilier — armoire métallique à rideaux coulissants, 198 cm", prix: 359.0, stock: 4 },
      // Fournitures
      { nom: "Ramette papier A4 80g (x5)", description: "Fournitures — carton de 5 ramettes de 500 feuilles A4 80 g", prix: 24.9, stock: 120 },
      { nom: "Lot de 12 stylos BIC Cristal", description: "Fournitures — stylos à bille pointe moyenne, encre bleue", prix: 4.5, stock: 200 },
      { nom: "Classeurs à levier (x10)", description: "Fournitures — lot de 10 classeurs à levier dos 80 mm, coloris assortis", prix: 32.9, stock: 45 },
      { nom: "Cartouche de toner HP 58A", description: "Fournitures — toner d'origine HP noir, 3000 pages", prix: 84.9, stock: 0 },
    ].map((data) => prisma.produit.create({ data }))
  );

  // ─── 25 commandes sur les 3 derniers mois ──────────────────────────────
  // [jours écoulés, index client, statut, lignes: [index produit, quantité][]]
  const commandesData: {
    jours: number;
    clientIdx: number;
    statut: StatutCommande;
    lignes: [number, number][];
  }[] = [
    { jours: 88, clientIdx: 0, statut: "LIVREE", lignes: [[4, 2], [6, 2], [7, 2]] },
    { jours: 85, clientIdx: 1, statut: "LIVREE", lignes: [[14, 10]] },
    { jours: 82, clientIdx: 2, statut: "LIVREE", lignes: [[10, 1], [11, 1]] },
    { jours: 78, clientIdx: 3, statut: "ANNULEE", lignes: [[2, 1]] },
    { jours: 74, clientIdx: 4, statut: "LIVREE", lignes: [[0, 1], [17, 2], [14, 4]] },
    { jours: 70, clientIdx: 5, statut: "LIVREE", lignes: [[5, 3], [8, 3]] },
    { jours: 66, clientIdx: 6, statut: "LIVREE", lignes: [[15, 20], [16, 3]] },
    { jours: 62, clientIdx: 7, statut: "LIVREE", lignes: [[4, 1], [5, 1], [6, 1], [7, 1]] },
    { jours: 58, clientIdx: 8, statut: "LIVREE", lignes: [[12, 2]] },
    { jours: 54, clientIdx: 9, statut: "ANNULEE", lignes: [[11, 2], [10, 2]] },
    { jours: 50, clientIdx: 10, statut: "LIVREE", lignes: [[9, 5]] },
    { jours: 46, clientIdx: 11, statut: "LIVREE", lignes: [[1, 1], [14, 6]] },
    { jours: 42, clientIdx: 0, statut: "LIVREE", lignes: [[13, 1], [12, 3]] },
    { jours: 38, clientIdx: 2, statut: "EXPEDIEE", lignes: [[3, 2], [15, 10]] },
    { jours: 34, clientIdx: 4, statut: "LIVREE", lignes: [[6, 4], [9, 2]] },
    { jours: 30, clientIdx: 1, statut: "EXPEDIEE", lignes: [[4, 3], [8, 3], [5, 3]] },
    { jours: 26, clientIdx: 6, statut: "LIVREE", lignes: [[14, 8], [16, 2], [15, 12]] },
    { jours: 22, clientIdx: 3, statut: "EXPEDIEE", lignes: [[0, 2], [17, 4]] },
    { jours: 18, clientIdx: 8, statut: "CONFIRMEE", lignes: [[10, 2]] },
    { jours: 15, clientIdx: 5, statut: "CONFIRMEE", lignes: [[5, 2], [6, 2]] },
    { jours: 12, clientIdx: 9, statut: "CONFIRMEE", lignes: [[12, 1], [13, 1], [3, 1]] },
    { jours: 9, clientIdx: 10, statut: "EN_ATTENTE", lignes: [[4, 1], [9, 1]] },
    { jours: 6, clientIdx: 11, statut: "EN_ATTENTE", lignes: [[14, 5], [15, 15]] },
    { jours: 3, clientIdx: 7, statut: "EN_ATTENTE", lignes: [[1, 1]] },
    { jours: 1, clientIdx: 0, statut: "EN_ATTENTE", lignes: [[6, 1], [7, 1], [16, 1], [15, 5]] },
  ];

  for (let i = 0; i < commandesData.length; i++) {
    const c = commandesData[i];
    const dateCommande = daysAgo(c.jours, 9 + (i % 8));

    const commande = await prisma.commande.create({
      data: {
        clientId: clients[c.clientIdx].id,
        date: dateCommande,
        statut: c.statut,
        lignes: {
          create: c.lignes.map(([produitIdx, quantite]: [number, number]) => ({
            produitId: produits[produitIdx].id,
            quantite,
            prixUnitaire: produits[produitIdx].prix,
          })),
        },
      },
    });

    const montantTotal = c.lignes.reduce(
      (total: number, [produitIdx, quantite]: [number, number]) =>
        total + produits[produitIdx].prix * quantite,
      0
    );

    // Répartition des paiements : 1 commande sur 3 payée intégralement,
    // 1 sur 3 partiellement payée, 1 sur 3 impayée
    const modes: ModePaiement[] = ["VIREMENT", "CARTE", "CHEQUE", "ESPECES"];
    let montantPaye = 0;
    const paiements: { montant: number; date: Date; mode: ModePaiement }[] = [];

    if (i % 3 === 0) {
      // Payée intégralement (parfois en 2 fois)
      if (montantTotal > 1000) {
        const acompte = Math.round(montantTotal * 0.4 * 100) / 100;
        paiements.push({ montant: acompte, date: daysAgo(c.jours - 1), mode: modes[i % 4] });
        paiements.push({
          montant: Math.round((montantTotal - acompte) * 100) / 100,
          date: daysAgo(Math.max(c.jours - 10, 0)),
          mode: modes[(i + 1) % 4],
        });
      } else {
        paiements.push({ montant: montantTotal, date: daysAgo(c.jours - 1), mode: modes[i % 4] });
      }
      montantPaye = montantTotal;
    } else if (i % 3 === 1) {
      // Partiellement payée (acompte de 30 %)
      const acompte = Math.round(montantTotal * 0.3 * 100) / 100;
      paiements.push({ montant: acompte, date: daysAgo(c.jours - 1), mode: modes[i % 4] });
      montantPaye = acompte;
    }
    // i % 3 === 2 : impayée, aucun paiement

    await prisma.facture.create({
      data: {
        commandeId: commande.id,
        montantTotal: Math.round(montantTotal * 100) / 100,
        montantPaye,
        date: dateCommande,
        paiements: { create: paiements },
      },
    });
  }

  const stats = {
    clients: await prisma.client.count(),
    produits: await prisma.produit.count(),
    produitsEnRupture: await prisma.produit.count({ where: { stock: 0 } }),
    commandes: await prisma.commande.count(),
    lignesCommande: await prisma.ligneCommande.count(),
    factures: await prisma.facture.count(),
    paiements: await prisma.paiement.count(),
  };
  console.log("Base de données initialisée :", stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
