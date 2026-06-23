import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const citoyens = await p.citoyen.findMany({ where: { photo: { not: null } }, select: { nom: true, photo: true } })
  for (const c of citoyens) {
    console.log(c.nom, ':', c.photo?.substring(0, 100))
  }
  if (!citoyens.length) console.log('Aucune photo trouvée')
}
main().catch(console.error).finally(() => p.$disconnect())
