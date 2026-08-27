-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Client";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Commande";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Facture";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LigneCommande";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Paiement";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Produit";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "produits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commandes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lignes_commande" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "commandeId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    CONSTRAINT "lignes_commande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lignes_commande_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "factures" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "commandeId" INTEGER NOT NULL,
    "montantTotal" REAL NOT NULL,
    "montantPaye" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "factures_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "commandes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "montant" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "mode" TEXT NOT NULL,
    CONSTRAINT "paiements_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "factures_commandeId_key" ON "factures"("commandeId");

