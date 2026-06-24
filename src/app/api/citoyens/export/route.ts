import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ville = searchParams.get('ville') || ''
  const statut = searchParams.get('statut') || ''
  const quartier = searchParams.get('quartier') || ''
  const situationFamiliale = searchParams.get('situationFamiliale') || ''
  const familleAuGabon = searchParams.get('familleAuGabon') || ''
  const carteColonie = searchParams.get('carteColonie') || ''

  const where: any = {}
  if (ville) where.ville = ville
  if (statut) where.situationRegularite = statut
  if (quartier) where.quartier = quartier
  if (situationFamiliale) where.situationFamiliale = situationFamiliale
  if (familleAuGabon) where.familleAuGabon = familleAuGabon === 'true'
  if (carteColonie) where.carteColonie = carteColonie

  const citoyens = await prisma.citoyen.findMany({
    where,
    orderBy: { nom: 'asc' },
  })

  const BOM = '﻿'
  const headers = [
    'N° Carte', 'Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Lieu de naissance',
    'Téléphone', 'Email', 'Ville', 'Quartier', 'Profession', 'Employeur',
    'Situation familiale', 'Enfants', 'Famille au Gabon',
    'Carte séjour', 'Carte colonie', 'Régularité', 'Passeport',
  ]

  const rows = citoyens.map((c) => [
    c.numeroCarte || '',
    c.nom,
    c.prenom,
    c.sexe === 'M' ? 'Homme' : 'Femme',
    c.dateNaissance,
    c.lieuNaissance,
    c.telephone || '',
    c.email || '',
    c.ville,
    c.quartier || '',
    c.profession || '',
    c.employeur || '',
    c.situationFamiliale || '',
    c.nombreEnfants.toString(),
    c.familleAuGabon ? 'Oui' : 'Non',
    c.carteSejour,
    c.carteColonie,
    c.situationRegularite,
    c.passeport,
  ])

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = BOM + [headers.map(escape).join(';'), ...rows.map((r) => r.map(escape).join(';'))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="membres-colonie-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
