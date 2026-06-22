import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const charte = await prisma.charte.findFirst()
  return NextResponse.json({ contenu: charte?.contenu || '' })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { contenu } = await req.json()
  const existing = await prisma.charte.findFirst()

  if (existing) {
    await prisma.charte.update({ where: { id: existing.id }, data: { contenu } })
  } else {
    await prisma.charte.create({ data: { contenu } })
  }

  return NextResponse.json({ success: true })
}
