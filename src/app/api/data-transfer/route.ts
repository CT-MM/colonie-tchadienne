import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const [citoyens, contributions, depenses, membresBureau, evenements, charte] = await Promise.all([
    prisma.citoyen.findMany(),
    prisma.contribution.findMany(),
    prisma.depense.findMany(),
    prisma.membreBureau.findMany(),
    prisma.evenement.findMany(),
    prisma.charte.findFirst(),
  ])

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    citoyens,
    contributions,
    depenses,
    membresBureau,
    evenements,
    charte,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()
  let counts = { citoyens: 0, contributions: 0, depenses: 0, membresBureau: 0, evenements: 0, charte: 0 }

  // Clear existing data (in order to respect foreign keys)
  await prisma.contribution.deleteMany()
  await prisma.membreBureau.deleteMany()
  await prisma.depense.deleteMany()
  await prisma.evenement.deleteMany()
  await prisma.charte.deleteMany()
  await prisma.citoyen.deleteMany()

  // Import citoyens
  if (data.citoyens?.length) {
    for (const c of data.citoyens) {
      const { contributions, membreBureau, ...citoyenData } = c
      delete citoyenData.updatedAt
      await prisma.citoyen.create({ data: citoyenData })
    }
    counts.citoyens = data.citoyens.length
  }

  // Import contributions
  if (data.contributions?.length) {
    for (const c of data.contributions) {
      await prisma.contribution.create({
        data: { id: c.id, montant: c.montant, date: c.date, description: c.description, citoyenId: c.citoyenId, createdAt: c.createdAt },
      })
    }
    counts.contributions = data.contributions.length
  }

  // Import depenses
  if (data.depenses?.length) {
    for (const d of data.depenses) {
      await prisma.depense.create({
        data: { id: d.id, montant: d.montant, date: d.date, motif: d.motif, description: d.description, createdAt: d.createdAt },
      })
    }
    counts.depenses = data.depenses.length
  }

  // Import membres bureau
  if (data.membresBureau?.length) {
    for (const m of data.membresBureau) {
      await prisma.membreBureau.create({
        data: { id: m.id, fonction: m.fonction, categorie: m.categorie || 'executif', ordre: m.ordre, citoyenId: m.citoyenId, createdAt: m.createdAt },
      })
    }
    counts.membresBureau = data.membresBureau.length
  }

  // Import evenements
  if (data.evenements?.length) {
    for (const e of data.evenements) {
      await prisma.evenement.create({
        data: { id: e.id, titre: e.titre, description: e.description, date: e.date, heure: e.heure, lieu: e.lieu, type: e.type, createdAt: e.createdAt },
      })
    }
    counts.evenements = data.evenements.length
  }

  // Import charte
  if (data.charte) {
    await prisma.charte.create({
      data: { contenu: data.charte.contenu },
    })
    counts.charte = 1
  }

  return NextResponse.json({ success: true, counts })
}
