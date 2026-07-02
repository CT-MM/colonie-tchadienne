import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'contributions', 'depenses', 'reguliers', 'irreguliers'
  const dateDebut = searchParams.get('dateDebut')
  const dateFin = searchParams.get('dateFin')

  if (type === 'contributions') {
    const where: any = {}
    if (dateDebut || dateFin) {
      where.date = {}
      if (dateDebut) where.date.gte = dateDebut
      if (dateFin) where.date.lte = dateFin
    }

    const contributions = await prisma.contribution.findMany({
      where,
      include: { citoyen: { select: { nom: true, prenom: true, ville: true, telephone: true, photo: true } } },
      orderBy: { date: 'asc' },
    })

    const total = contributions.reduce((s, c) => s + c.montant, 0)
    return NextResponse.json({ data: contributions, total, count: contributions.length })
  }

  if (type === 'depenses') {
    const where: any = {}
    if (dateDebut || dateFin) {
      where.date = {}
      if (dateDebut) where.date.gte = dateDebut
      if (dateFin) where.date.lte = dateFin
    }

    const depenses = await prisma.depense.findMany({ where, orderBy: { date: 'asc' } })
    const total = depenses.reduce((s, d) => s + d.montant, 0)
    return NextResponse.json({ data: depenses, total, count: depenses.length })
  }

  if (type === 'reguliers') {
    const citoyens = await prisma.citoyen.findMany({
      where: { situationRegularite: 'Régulier' },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json({ data: citoyens, count: citoyens.length })
  }

  if (type === 'irreguliers') {
    const citoyens = await prisma.citoyen.findMany({
      where: { situationRegularite: { not: 'Régulier' } },
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json({ data: citoyens, count: citoyens.length })
  }

  return NextResponse.json({ error: 'Type de rapport invalide' }, { status: 400 })
}
