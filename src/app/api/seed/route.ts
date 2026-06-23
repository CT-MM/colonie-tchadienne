import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== 'Bearer colonie-transfer-2024') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const adminHash = await bcrypt.hash('admin123', 10)
  const bureauHash = await bcrypt.hash('bureau123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@colonie-tchad.ga' },
    update: { password: adminHash },
    create: { email: 'admin@colonie-tchad.ga', name: 'Administrateur', password: adminHash, role: 'admin' },
  })

  const bureau = await prisma.user.upsert({
    where: { email: 'bureau@colonie-tchad.ga' },
    update: { password: bureauHash },
    create: { email: 'bureau@colonie-tchad.ga', name: 'Bureau', password: bureauHash, role: 'bureau' },
  })

  return NextResponse.json({ ok: true, admin: admin.email, bureau: bureau.email })
}
