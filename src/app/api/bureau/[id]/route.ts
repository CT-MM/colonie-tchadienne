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
  const membre = await prisma.membreBureau.update({
    where: { id },
    data: { fonction: data.fonction, ordre: data.ordre },
    include: { citoyen: { select: { id: true, nom: true, prenom: true, telephone: true, photo: true, ville: true } } },
  })
  return NextResponse.json(membre)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { id } = await params
  await prisma.membreBureau.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
