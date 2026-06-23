import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@colonie-tchad.ga' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@colonie-tchad.ga',
      password: adminPassword,
      role: 'admin',
    },
  })

  const bureauPassword = await hash('bureau123', 12)
  await prisma.user.upsert({
    where: { email: 'bureau@colonie-tchad.ga' },
    update: {},
    create: {
      name: 'Membre Bureau',
      email: 'bureau@colonie-tchad.ga',
      password: bureauPassword,
      role: 'bureau',
    },
  })

  console.log('Comptes créés :')
  console.log('  Admin  : admin@colonie-tchad.ga / admin123')
  console.log('  Bureau : bureau@colonie-tchad.ga / bureau123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
