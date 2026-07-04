import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const [citoyens, totalContrib, totalDep, nbContributions, nbDepenses] = await Promise.all([
    prisma.citoyen.findMany({
      select: {
        ville: true,
        quartier: true,
        sexe: true,
        carteSejour: true,
        carteColonie: true,
        carteColonieMontant: true,
        situationRegularite: true,
        estEmploye: true,
      },
    }),
    prisma.contribution.aggregate({ _sum: { montant: true } }),
    prisma.depense.aggregate({ _sum: { montant: true } }),
    prisma.contribution.count(),
    prisma.depense.count(),
  ])

  let totalMoanda = 0, totalMounana = 0
  let carteSejourOui = 0
  let carteColonieOk = 0, carteColonieEncours = 0, carteColonieNon = 0
  let reguliers = 0, irreguliers = 0, enCours = 0
  let employes = 0, nonEmployes = 0
  let hommes = 0, femmes = 0
  let montantTotal = 0
  const quartierCount: Record<string, number> = {}
  const quartierCanonical: Record<string, string> = {}

  const normalizeQuartier = (q: string) => q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

  for (const c of citoyens) {
    if (c.quartier) {
      const key = normalizeQuartier(c.quartier)
      if (!quartierCanonical[key]) quartierCanonical[key] = c.quartier.trim()
      quartierCount[key] = (quartierCount[key] || 0) + 1
    }
    if (c.ville === 'Moanda') totalMoanda++
    else if (c.ville === 'Mounana') totalMounana++
    if (c.carteSejour === 'Oui') carteSejourOui++
    if (c.carteColonie === 'Ok') carteColonieOk++
    else if (c.carteColonie === 'Encours') carteColonieEncours++
    else carteColonieNon++
    if (c.situationRegularite === 'Régulier') reguliers++
    else if (c.situationRegularite === 'Irrégulier') irreguliers++
    else enCours++
    if (c.estEmploye) employes++
    else nonEmployes++
    if (c.sexe === 'M') hommes++
    else femmes++
    montantTotal += c.carteColonieMontant
  }

  const totalContributions = totalContrib._sum.montant || 0
  const totalDepenses = totalDep._sum.montant || 0

  const topQuartiers = Object.entries(quartierCount)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ nom: quartierCanonical[key], count }))

  return NextResponse.json({
    totalCitoyens: citoyens.length,
    parVille: { Moanda: totalMoanda, Mounana: totalMounana },
    topQuartiers,
    carteSejour: { oui: carteSejourOui, non: citoyens.length - carteSejourOui },
    carteColonie: { ok: carteColonieOk, encours: carteColonieEncours, non: carteColonieNon },
    regularite: { regulier: reguliers, irregulier: irreguliers, enCours },
    emploi: { employe: employes, nonEmploye: nonEmployes },
    sexe: { hommes, femmes },
    montantTotal,
    tresorerie: {
      totalContributions,
      totalDepenses,
      solde: totalContributions - totalDepenses,
      nbContributions,
      nbDepenses,
    },
  })
}
