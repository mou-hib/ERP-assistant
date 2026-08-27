-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneCommande" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "commandeId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LigneCommande_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "commandeId" INTEGER NOT NULL,
    "montantTotal" REAL NOT NULL,
    "montantPaye" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Facture_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factureId" INTEGER NOT NULL,
    "montant" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "mode" TEXT NOT NULL,
    CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_commandeId_key" ON "Facture"("commandeId");
