import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { numero, pin } = await req.json()

  if (!numero || !pin) {
    return NextResponse.json({ error: 'Numéro et code PIN requis' }, { status: 400 })
  }

  const citoyen = await prisma.citoyen.findFirst({
    where: {
      OR: [
        { numeroCarte: numero.toUpperCase() },
        { carteColonieNumero: numero.toUpperCase() },
      ],
    },
    include: {
      contributions: { orderBy: { date: 'desc' } },
    },
  })

  if (!citoyen) {
    return NextResponse.json({ error: 'Numéro de carte introuvable' }, { status: 404 })
  }

  if (!citoyen.pin) {
    return NextResponse.json({ error: 'Aucun code PIN défini' }, { status: 400 })
  }

  if (citoyen.pin !== pin) {
    return NextResponse.json({ error: 'Code PIN incorrect' }, { status: 401 })
  }

  const bureau = await prisma.membreBureau.findMany({
    include: {
      citoyen: {
        select: { nom: true, prenom: true, telephone: true, photo: true, ville: true, email: true },
      },
    },
    orderBy: { ordre: 'asc' },
  })

  const evenements = await prisma.evenement.findMany({
    where: { date: { gte: new Date().toISOString().split('T')[0] } },
    orderBy: { date: 'asc' },
    take: 10,
  })

  const charte = await prisma.charte.findFirst()
  const settings = await prisma.setting.findUnique({ where: { key: 'group-link' } })
  const totalContrib = citoyen.contributions.reduce((s, c) => s + c.montant, 0)

  return NextResponse.json({
    groupLink: settings?.value || null,
    citoyen: {
      nom: citoyen.nom,
      prenom: citoyen.prenom,
      dateNaissance: citoyen.dateNaissance,
      lieuNaissance: citoyen.lieuNaissance,
      sexe: citoyen.sexe,
      ville: citoyen.ville,
      quartier: citoyen.quartier,
      telephone: citoyen.telephone,
      profession: citoyen.profession,
      photo: citoyen.photo,
      numeroCarte: citoyen.numeroCarte,
      carteSejour: citoyen.carteSejour,
      carteColonie: citoyen.carteColonie,
      situationRegularite: citoyen.situationRegularite,
      passeport: citoyen.passeport,
    },
    contributions: citoyen.contributions,
    totalContributions: totalContrib,
    bureau,
    evenements,
    charte: charte?.contenu || null,
  })
}
