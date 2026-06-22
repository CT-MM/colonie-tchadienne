import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [
    totalCitoyens,
    totalMoanda,
    totalMounana,
    carteSejourOui,
    carteColonieOk,
    carteColonieEncours,
    carteColonieNon,
    reguliers,
    irreguliers,
    enCours,
    employes,
    nonEmployes,
    hommes,
    femmes,
    allCitoyens,
    totalContrib,
    totalDep,
    nbContributions,
    nbDepenses,
  ] = await Promise.all([
    prisma.citoyen.count(),
    prisma.citoyen.count({ where: { ville: 'Moanda' } }),
    prisma.citoyen.count({ where: { ville: 'Mounana' } }),
    prisma.citoyen.count({ where: { carteSejour: 'Oui' } }),
    prisma.citoyen.count({ where: { carteColonie: 'Ok' } }),
    prisma.citoyen.count({ where: { carteColonie: 'Encours' } }),
    prisma.citoyen.count({ where: { carteColonie: 'Non' } }),
    prisma.citoyen.count({ where: { situationRegularite: 'Régulier' } }),
    prisma.citoyen.count({ where: { situationRegularite: 'Irrégulier' } }),
    prisma.citoyen.count({ where: { situationRegularite: 'En cours' } }),
    prisma.citoyen.count({ where: { estEmploye: true } }),
    prisma.citoyen.count({ where: { estEmploye: false } }),
    prisma.citoyen.count({ where: { sexe: 'M' } }),
    prisma.citoyen.count({ where: { sexe: 'F' } }),
    prisma.citoyen.aggregate({ _sum: { carteColonieMontant: true } }),
    prisma.contribution.aggregate({ _sum: { montant: true } }),
    prisma.depense.aggregate({ _sum: { montant: true } }),
    prisma.contribution.count(),
    prisma.depense.count(),
  ])

  const totalContributions = totalContrib._sum.montant || 0
  const totalDepenses = totalDep._sum.montant || 0

  return NextResponse.json({
    totalCitoyens,
    parVille: { Moanda: totalMoanda, Mounana: totalMounana },
    carteSejour: { oui: carteSejourOui, non: totalCitoyens - carteSejourOui },
    carteColonie: { ok: carteColonieOk, encours: carteColonieEncours, non: carteColonieNon },
    regularite: { regulier: reguliers, irregulier: irreguliers, enCours },
    emploi: { employe: employes, nonEmploye: nonEmployes },
    sexe: { hommes, femmes },
    montantTotal: allCitoyens._sum.carteColonieMontant || 0,
    tresorerie: {
      totalContributions,
      totalDepenses,
      solde: totalContributions - totalDepenses,
      nbContributions,
      nbDepenses,
    },
  })
}
