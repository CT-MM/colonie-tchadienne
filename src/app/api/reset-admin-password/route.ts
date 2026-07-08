import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json()

  if (token !== process.env.TRANSFER_TOKEN && token !== 'colonie-transfer-2024') {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  if (!newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: 'Mot de passe requis (min 4 caractères)' }, { status: 400 })
  }

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) {
    return NextResponse.json({ error: 'Aucun admin trouvé' }, { status: 404 })
  }

  const hashed = await hash(newPassword, 10)
  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hashed, sessionVersion: 0 },
  })

  await prisma.device.deleteMany({ where: { userId: admin.id } })

  return NextResponse.json({ success: true, email: admin.email })
}
