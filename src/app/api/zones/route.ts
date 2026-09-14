import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const zones = await prisma.zone.findMany({
    include: {
      delegues: {
        include: {
          citoyen: {
            select: { id: true, nom: true, prenom: true, telephone: true, photo: true, ville: true, quartier: true },
          },
        },
      },
    },
    orderBy: { ordre: 'asc' },
  })

  return NextResponse.json({ zones })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()
  const count = await prisma.zone.count()

  const zone = await prisma.zone.create({
    data: {
      nom: data.nom,
      quartiers: JSON.stringify(data.quartiers || []),
      ordre: count,
    },
    include: {
      delegues: {
        include: {
          citoyen: {
            select: { id: true, nom: true, prenom: true, telephone: true, photo: true, ville: true, quartier: true },
          },
        },
      },
    },
  })

  return NextResponse.json(zone, { status: 201 })
}
