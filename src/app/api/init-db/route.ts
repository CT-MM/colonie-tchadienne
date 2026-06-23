import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer colonie-transfer-2024') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'viewer',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Citoyen" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nom" TEXT NOT NULL,
      "prenom" TEXT NOT NULL,
      "dateNaissance" TEXT NOT NULL,
      "lieuNaissance" TEXT NOT NULL,
      "sexe" TEXT NOT NULL,
      "nationalite" TEXT NOT NULL DEFAULT 'Tchadienne',
      "telephone" TEXT,
      "email" TEXT,
      "photo" TEXT,
      "ville" TEXT NOT NULL,
      "quartier" TEXT,
      "adresse" TEXT,
      "profession" TEXT,
      "employeur" TEXT,
      "estEmploye" BOOLEAN NOT NULL DEFAULT false,
      "situationFamiliale" TEXT,
      "nombreEnfants" INTEGER NOT NULL DEFAULT 0,
      "familleAuGabon" BOOLEAN NOT NULL DEFAULT false,
      "carteSejour" TEXT NOT NULL DEFAULT 'Non',
      "carteSejourNumero" TEXT,
      "carteSejourExpiration" TEXT,
      "carteColonie" TEXT NOT NULL DEFAULT 'Non',
      "carteColonieNumero" TEXT,
      "carteColonieMontant" REAL NOT NULL DEFAULT 0,
      "situationRegularite" TEXT NOT NULL DEFAULT 'Irrégulier',
      "passeport" TEXT NOT NULL DEFAULT 'Non',
      "passeportNumero" TEXT,
      "passeportExpiration" TEXT,
      "numeroCarte" TEXT,
      "pin" TEXT,
      "observations" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Citoyen_numeroCarte_key" ON "Citoyen"("numeroCarte")`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Contribution" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "montant" REAL NOT NULL,
      "date" TEXT NOT NULL,
      "description" TEXT,
      "citoyenId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Contribution_citoyenId_fkey" FOREIGN KEY ("citoyenId") REFERENCES "Citoyen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Depense" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "montant" REAL NOT NULL,
      "date" TEXT NOT NULL,
      "motif" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "MembreBureau" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "fonction" TEXT NOT NULL,
      "categorie" TEXT NOT NULL DEFAULT 'executif',
      "ordre" INTEGER NOT NULL DEFAULT 0,
      "citoyenId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MembreBureau_citoyenId_fkey" FOREIGN KEY ("citoyenId") REFERENCES "Citoyen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MembreBureau_citoyenId_key" ON "MembreBureau"("citoyenId")`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Evenement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "titre" TEXT NOT NULL,
      "description" TEXT,
      "date" TEXT NOT NULL,
      "heure" TEXT,
      "lieu" TEXT,
      "type" TEXT NOT NULL DEFAULT 'reunion',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Charte" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "contenu" TEXT NOT NULL,
      "updatedAt" DATETIME NOT NULL
    )`)

    return NextResponse.json({ ok: true, message: 'Tables créées avec succès' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
