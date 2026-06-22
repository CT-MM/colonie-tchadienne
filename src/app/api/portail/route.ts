import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const numero = searchParams.get('numero')

  if (!numero) {
    return NextResponse.json({ error: 'Numéro de carte requis' }, { status: 400 })
  }

  const citoyen = await prisma.citoyen.findFirst({
    where: {
      OR: [
        { numeroCarte: numero.toUpperCase() },
        { carteColonieNumero: numero.toUpperCase() },
      ],
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      numeroCarte: true,
      pin: true,
      telephone: true,
    },
  })

  if (!citoyen) {
    return NextResponse.json({ error: 'Aucun citoyen trouvé avec ce numéro' }, { status: 404 })
  }

  return NextResponse.json({
    found: true,
    hasPin: !!citoyen.pin,
    nom: citoyen.nom,
    prenom: citoyen.prenom,
    numeroCarte: citoyen.numeroCarte,
    telephoneMasque: citoyen.telephone
      ? citoyen.telephone.replace(/(.{3})(.*)(.{2})/, '$1*****$3')
      : null,
  })
}
