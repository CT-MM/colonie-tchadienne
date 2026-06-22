import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { numero, pin } = await req.json()

  if (!numero || !pin) {
    return NextResponse.json({ error: 'Numéro et code PIN requis' }, { status: 400 })
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: 'Le code PIN doit contenir exactement 6 chiffres' }, { status: 400 })
  }

  const citoyen = await prisma.citoyen.findFirst({
    where: {
      OR: [
        { numeroCarte: numero.toUpperCase() },
        { carteColonieNumero: numero.toUpperCase() },
      ],
    },
  })

  if (!citoyen) {
    return NextResponse.json({ error: 'Numéro de carte introuvable' }, { status: 404 })
  }

  if (citoyen.pin) {
    return NextResponse.json({ error: 'Un code PIN existe déjà. Utilisez la réinitialisation.' }, { status: 400 })
  }

  await prisma.citoyen.update({
    where: { id: citoyen.id },
    data: { pin },
  })

  return NextResponse.json({ success: true })
}
