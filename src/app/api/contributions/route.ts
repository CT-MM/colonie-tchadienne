import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const citoyenId = searchParams.get('citoyenId')
  const dateDebut = searchParams.get('dateDebut')
  const dateFin = searchParams.get('dateFin')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (citoyenId) where.citoyenId = citoyenId
  if (dateDebut || dateFin) {
    where.date = {}
    if (dateDebut) where.date.gte = dateDebut
    if (dateFin) where.date.lte = dateFin
  }

  const [contributions, total] = await Promise.all([
    prisma.contribution.findMany({
      where,
      include: { citoyen: { select: { nom: true, prenom: true, ville: true, photo: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contribution.count({ where }),
  ])

  const totalMontant = await prisma.contribution.aggregate({
    where,
    _sum: { montant: true },
  })

  return NextResponse.json({
    contributions,
    total,
    totalMontant: totalMontant._sum.montant || 0,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()
  const contribution = await prisma.contribution.create({
    data: {
      montant: parseFloat(data.montant),
      date: data.date,
      description: data.description || null,
      citoyenId: data.citoyenId,
    },
    include: { citoyen: { select: { nom: true, prenom: true } } },
  })

  return NextResponse.json(contribution)
}
