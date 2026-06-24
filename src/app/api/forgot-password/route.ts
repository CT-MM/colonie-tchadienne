import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, telephone, newPassword } = await req.json()

  if (!email || !telephone || !newPassword) {
    return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 })
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 4 caractères' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Aucun compte trouvé avec cet email' }, { status: 404 })
  }

  const citoyen = await prisma.citoyen.findFirst({
    where: { email: email },
  })

  if (!citoyen || !citoyen.telephone) {
    return NextResponse.json({ error: 'Aucun membre associé à cet email. Contactez l\'administrateur.' }, { status: 404 })
  }

  const cleanInput = telephone.replace(/[\s\-\.\+]/g, '')
  const cleanStored = citoyen.telephone.replace(/[\s\-\.\+]/g, '')

  if (!cleanStored.endsWith(cleanInput) && !cleanInput.endsWith(cleanStored) && cleanInput !== cleanStored) {
    return NextResponse.json({ error: 'Le numéro de téléphone ne correspond pas' }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } })

  return NextResponse.json({ success: true })
}
