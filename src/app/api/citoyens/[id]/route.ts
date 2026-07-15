import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const citoyen = await prisma.citoyen.findUnique({ where: { id } })
  if (!citoyen) return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })

  return NextResponse.json(citoyen)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id } = await params
  const data = await req.json()

  if (data.carteColonie === 'Ok' || data.carteColonie === 'Encours') {
    const current = await prisma.citoyen.findUnique({ where: { id }, select: { carteColonie: true } })
    if (current && current.carteColonie !== 'Ok' && current.carteColonie !== 'Encours') {
      const existing = await prisma.contribution.findFirst({
        where: { citoyenId: id, description: "Frais d'enregistrement" },
      })
      if (!existing) {
        await prisma.contribution.create({
          data: {
            montant: 5000,
            date: new Date().toISOString().split('T')[0],
            description: "Frais d'enregistrement",
            citoyenId: id,
          },
        })
      }
    }
  }

  const citoyen = await prisma.citoyen.update({ where: { id }, data })
  return NextResponse.json(citoyen)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { id } = await params
  await prisma.citoyen.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
