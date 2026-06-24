import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { orderedIds } = await req.json()

  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.membreBureau.update({
      where: { id: orderedIds[i] },
      data: { ordre: i },
    })
  }

  return NextResponse.json({ ok: true })
}
