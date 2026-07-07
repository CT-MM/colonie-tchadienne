import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const KEY = 'card_layout'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: KEY } })
    return NextResponse.json({ layout: setting?.value ? JSON.parse(setting.value) : null })
  } catch {
    return NextResponse.json({ layout: null })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { layout } = await req.json()

  if (!layout) {
    try { await prisma.setting.delete({ where: { key: KEY } }) } catch {}
    return NextResponse.json({ success: true })
  }

  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(layout) },
    create: { key: KEY, value: JSON.stringify(layout) },
  })

  return NextResponse.json({ success: true })
}
