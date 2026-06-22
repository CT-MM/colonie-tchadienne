import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const evenements = await prisma.evenement.findMany({
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ evenements })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const data = await req.json()
  const evenement = await prisma.evenement.create({
    data: {
      titre: data.titre,
      description: data.description || null,
      date: data.date,
      heure: data.heure || null,
      lieu: data.lieu || null,
      type: data.type || 'reunion',
    },
  })

  return NextResponse.json(evenement)
}
