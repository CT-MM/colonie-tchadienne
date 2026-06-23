import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const citoyens = await p.citoyen.findMany({ include: { contributions: true } })
  let removed = 0
  for (const c of citoyens) {
    if (c.contributions.length > 0 && c.carteColonie !== 'Ok' && c.carteColonie !== 'Encours') {
      const del = await p.contribution.deleteMany({ where: { citoyenId: c.id } })
      console.log(`${c.nom} ${c.prenom} — carteColonie: "${c.carteColonie}" — ${del.count} contribution(s) supprimée(s)`)
      removed += del.count
    }
  }
  console.log(`\nTotal: ${removed} contributions supprimées`)
}
main().catch(console.error).finally(() => p.$disconnect())
