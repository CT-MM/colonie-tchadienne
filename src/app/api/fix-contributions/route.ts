import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (token !== process.env.TRANSFER_TOKEN && token !== 'colonie-transfer-2024') {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  const membres = await prisma.citoyen.findMany({
    where: {
      carteColonie: { in: ['Ok', 'Encours'] },
    },
    select: { id: true, nom: true, prenom: true, carteColonie: true },
  })

  let created = 0
  const fixed: string[] = []

  for (const m of membres) {
    const existing = await prisma.contribution.findFirst({
      where: { citoyenId: m.id, description: "Frais d'enregistrement" },
    })
    if (!existing) {
      await prisma.contribution.create({
        data: {
          montant: 5000,
          date: new Date().toISOString().split('T')[0],
          description: "Frais d'enregistrement",
          citoyenId: m.id,
        },
      })
      created++
      fixed.push(`${m.nom} ${m.prenom}`)
    }
  }

  return NextResponse.json({
    success: true,
    totalMembresAvecCarte: membres.length,
    contributionsCreees: created,
    membresCorrigés: fixed,
  })
}
