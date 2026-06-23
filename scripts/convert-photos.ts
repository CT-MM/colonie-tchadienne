import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const p = new PrismaClient()

async function main() {
  const citoyens = await p.citoyen.findMany({ where: { photo: { not: null } } })
  let converted = 0

  for (const c of citoyens) {
    if (!c.photo || c.photo.startsWith('data:')) continue

    const filePath = join(process.cwd(), 'public', c.photo)
    if (!existsSync(filePath)) {
      console.log(`❌ ${c.nom} — fichier introuvable: ${filePath}`)
      continue
    }

    const buffer = readFileSync(filePath)
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`

    await p.citoyen.update({
      where: { id: c.id },
      data: { photo: base64 },
    })

    converted++
    console.log(`✅ ${c.nom} ${c.prenom} — photo convertie (${Math.round(buffer.length / 1024)} Ko)`)
  }

  console.log(`\n${converted} photos converties en base64`)
}

main().catch(console.error).finally(() => p.$disconnect())
