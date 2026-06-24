import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const LOGO_KEY = 'platform_logo'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: LOGO_KEY } })
    return NextResponse.json({ logo: setting?.value || null })
  } catch {
    return NextResponse.json({ logo: null })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('logo') as File
  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 2 Mo)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = `data:${file.type || 'image/png'};base64,${Buffer.from(bytes).toString('base64')}`

  await prisma.setting.upsert({
    where: { key: LOGO_KEY },
    update: { value: base64 },
    create: { key: LOGO_KEY, value: base64 },
  })

  return NextResponse.json({ success: true, logo: base64 })
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  try {
    await prisma.setting.delete({ where: { key: LOGO_KEY } })
  } catch {}

  return NextResponse.json({ success: true })
}
