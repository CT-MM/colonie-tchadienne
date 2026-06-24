import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ville = searchParams.get('ville') || ''

  const where: any = { quartier: { not: null } }
  if (ville) where.ville = ville

  const citoyens = await prisma.citoyen.findMany({
    where,
    select: { quartier: true, ville: true },
  })

  const quartiersByVille: Record<string, string[]> = {}
  for (const c of citoyens) {
    if (!c.quartier) continue
    const v = c.ville
    if (!quartiersByVille[v]) quartiersByVille[v] = []
    if (!quartiersByVille[v].includes(c.quartier)) {
      quartiersByVille[v].push(c.quartier)
    }
  }

  for (const v in quartiersByVille) {
    quartiersByVille[v].sort()
  }

  return NextResponse.json(quartiersByVille)
}
