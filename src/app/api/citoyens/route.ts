import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const ville = searchParams.get('ville') || ''
  const statut = searchParams.get('statut') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = {}

  if (search) {
    where.OR = [
      { nom: { contains: search } },
      { prenom: { contains: search } },
      { telephone: { contains: search } },
    ]
  }
  if (ville) where.ville = ville
  if (statut) where.situationRegularite = statut

  const [citoyens, total] = await Promise.all([
    prisma.citoyen.findMany({
      where,
      include: {
        contributions: { select: { montant: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.citoyen.count({ where }),
  ])

  const citoyensWithContrib = citoyens.map((c) => ({
    ...c,
    totalContributions: c.contributions.reduce((s, x) => s + x.montant, 0),
    aContribue: c.contributions.length > 0,
    contributions: undefined,
  }))

  return NextResponse.json({ citoyens: citoyensWithContrib, total, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const data = await req.json()

  const last = await prisma.citoyen.findFirst({
    where: { numeroCarte: { not: null } },
    orderBy: { numeroCarte: 'desc' },
  })
  let nextNum = 1
  if (last?.numeroCarte) {
    const match = last.numeroCarte.match(/(\d+)$/)
    if (match) nextNum = parseInt(match[1]) + 1
  }
  data.numeroCarte = `CT-MM-${String(nextNum).padStart(3, '0')}`

  const citoyen = await prisma.citoyen.create({ data })

  if (data.carteColonie === 'Ok' || data.carteColonie === 'Encours') {
    await prisma.contribution.create({
      data: {
        montant: 5000,
        date: new Date().toISOString().split('T')[0],
        description: 'Frais d\'enregistrement',
        citoyenId: citoyen.id,
      },
    })
  }

  return NextResponse.json(citoyen, { status: 201 })
}
