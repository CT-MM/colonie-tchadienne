import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { numero, telephone, newPin } = await req.json()

  if (!numero || !telephone || !newPin) {
    return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
  }

  if (!/^\d{6}$/.test(newPin)) {
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

  const telNormalized = telephone.replace(/\s+/g, '').replace(/^(\+?241)/, '')
  const citoyenTelNormalized = (citoyen.telephone || '').replace(/\s+/g, '').replace(/^(\+?241)/, '')

  if (!citoyenTelNormalized || telNormalized !== citoyenTelNormalized) {
    return NextResponse.json({ error: 'Le numéro de téléphone ne correspond pas à celui enregistré' }, { status: 401 })
  }

  await prisma.citoyen.update({
    where: { id: citoyen.id },
    data: { pin: newPin },
  })

  return NextResponse.json({ success: true })
}
