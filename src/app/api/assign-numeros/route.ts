import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const citoyens = await prisma.citoyen.findMany({
    where: { numeroCarte: null },
    orderBy: { createdAt: 'asc' },
  })

  const lastAssigned = await prisma.citoyen.findFirst({
    where: { numeroCarte: { not: null } },
    orderBy: { numeroCarte: 'desc' },
  })

  let nextNum = 1
  if (lastAssigned?.numeroCarte) {
    const match = lastAssigned.numeroCarte.match(/(\d+)$/)
    if (match) nextNum = parseInt(match[1]) + 1
  }

  for (const c of citoyens) {
    await prisma.citoyen.update({
      where: { id: c.id },
      data: { numeroCarte: `CT-MM-${String(nextNum).padStart(3, '0')}` },
    })
    nextNum++
  }

  return NextResponse.json({ assigned: citoyens.length })
}
