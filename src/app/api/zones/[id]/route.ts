import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  const data = await req.json()

  if (data.action === 'add-delegue') {
    const existing = await prisma.delegueZone.findUnique({
      where: { zoneId_citoyenId: { zoneId: id, citoyenId: data.citoyenId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ce membre est déjà délégué de cette zone' }, { status: 400 })
    }
    const delegue = await prisma.delegueZone.create({
      data: { zoneId: id, citoyenId: data.citoyenId, role: data.role || 'Délégué' },
      include: {
        citoyen: {
          select: { id: true, nom: true, prenom: true, telephone: true, photo: true, ville: true, quartier: true },
        },
      },
    })
    return NextResponse.json(delegue)
  }

  if (data.action === 'remove-delegue') {
    await prisma.delegueZone.delete({
      where: { zoneId_citoyenId: { zoneId: id, citoyenId: data.citoyenId } },
    })
    return NextResponse.json({ success: true })
  }

  const zone = await prisma.zone.update({
    where: { id },
    data: {
      ...(data.nom && { nom: data.nom }),
      ...(data.quartiers && { quartiers: JSON.stringify(data.quartiers) }),
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

  return NextResponse.json(zone)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  await prisma.zone.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
