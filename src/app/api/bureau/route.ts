import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const membres = await prisma.membreBureau.findMany({
    include: {
      citoyen: {
        select: { id: true, nom: true, prenom: true, telephone: true, photo: true, ville: true, profession: true },
      },
    },
    orderBy: { ordre: 'asc' },
  })

  return NextResponse.json({ membres })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()

  const existing = await prisma.membreBureau.findUnique({ where: { citoyenId: data.citoyenId } })
  if (existing) {
    return NextResponse.json({ error: 'Ce citoyen est déjà membre du bureau' }, { status: 400 })
  }

  const count = await prisma.membreBureau.count()
  const membre = await prisma.membreBureau.create({
    data: {
      fonction: data.fonction,
      categorie: data.categorie || 'executif',
      ordre: data.ordre ?? count,
      citoyenId: data.citoyenId,
    },
    include: {
      citoyen: {
        select: { id: true, nom: true, prenom: true, telephone: true, photo: true, ville: true, profession: true },
      },
    },
  })

  return NextResponse.json(membre)
}
