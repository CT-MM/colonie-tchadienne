import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateDebut = searchParams.get('dateDebut')
  const dateFin = searchParams.get('dateFin')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (dateDebut || dateFin) {
    where.date = {}
    if (dateDebut) where.date.gte = dateDebut
    if (dateFin) where.date.lte = dateFin
  }

  const [depenses, total] = await Promise.all([
    prisma.depense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.depense.count({ where }),
  ])

  const totalMontant = await prisma.depense.aggregate({
    where,
    _sum: { montant: true },
  })

  return NextResponse.json({
    depenses,
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
  const depense = await prisma.depense.create({
    data: {
      montant: parseFloat(data.montant),
      date: data.date,
      motif: data.motif,
      description: data.description || null,
    },
  })

  return NextResponse.json(depense)
}
