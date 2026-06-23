import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const RAILWAY_URL = process.argv[2] || 'https://colonie-tchadienne-production.up.railway.app'
const TOKEN = 'colonie-transfer-2024'

async function main() {
  console.log('📦 Export des données locales...')

  const [citoyens, contributions, depenses, membresBureau, evenements, charte] = await Promise.all([
    prisma.citoyen.findMany(),
    prisma.contribution.findMany(),
    prisma.depense.findMany(),
    prisma.membreBureau.findMany(),
    prisma.evenement.findMany(),
    prisma.charte.findFirst(),
  ])

  console.log(`  ${citoyens.length} citoyens`)
  console.log(`  ${contributions.length} contributions`)
  console.log(`  ${depenses.length} dépenses`)
  console.log(`  ${membresBureau.length} membres bureau`)
  console.log(`  ${evenements.length} événements`)
  console.log(`  ${charte ? '1' : '0'} charte`)

  const payload = { citoyens, contributions, depenses, membresBureau, evenements, charte }

  console.log(`\n🚀 Envoi vers ${RAILWAY_URL}...`)

  const res = await fetch(`${RAILWAY_URL}/api/data-transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  })

  const result = await res.json()

  if (res.ok) {
    console.log('\n✅ Transfert réussi !')
    console.log('Données importées :', result.counts)
  } else {
    console.error('\n❌ Erreur :', result.error || result)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
