import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const c = await p.citoyen.count()
  const co = await p.contribution.count()
  const d = await p.depense.count()
  const m = await p.membreBureau.count()
  const e = await p.evenement.count()
  console.log(`Citoyens: ${c}, Contributions: ${co}, Depenses: ${d}, Bureau: ${m}, Evenements: ${e}`)
}
main().catch(console.error).finally(() => p.$disconnect())
