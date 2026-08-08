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

    const [contributions, agg] = await Promise.all([
      prisma.contribution.findMany({
        where,
        include: { citoyen: { select: { nom: true, prenom: true, ville: true, telephone: true, photo: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.contribution.aggregate({ where, _sum: { montant: true } }),
    ])

    return NextResponse.json({ data: contributions, total: agg._sum.montant || 0, count: contributions.length })
  }

  if (type === 'depenses') {
    const where: any = {}
    if (dateDebut || dateFin) {
      where.date = {}
      if (dateDebut) where.date.gte = dateDebut
      if (dateFin) where.date.lte = dateFin
    }

    const [depenses, depAgg] = await Promise.all([
      prisma.depense.findMany({ where, orderBy: { date: 'asc' } }),
      prisma.depense.aggregate({ where, _sum: { montant: true } }),
    ])
    return NextResponse.json({ data: depenses, total: depAgg._sum.montant || 0, count: depenses.length })
  }

  const selectListe = { id: true, nom: true, prenom: true, sexe: true, ville: true, telephone: true, profession: true, carteSejour: true, photo: true }

  if (type === 'reguliers') {
    const citoyens = await prisma.citoyen.findMany({
      where: { situationRegularite: 'Régulier' },
      select: selectListe,
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json({ data: citoyens, count: citoyens.length })
  }

  if (type === 'irreguliers') {
    const citoyens = await prisma.citoyen.findMany({
      where: { situationRegularite: { not: 'Régulier' } },
      select: selectListe,
      orderBy: { nom: 'asc' },
    })
    return NextResponse.json({ data: citoyens, count: citoyens.length })
  }

  return NextResponse.json({ error: 'Type de rapport invalide' }, { status: 400 })
}
