import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const KEY = 'group_link'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: KEY } })
    return NextResponse.json({ link: setting?.value || '' })
  } catch {
    return NextResponse.json({ link: '' })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { link } = await req.json()

  if (!link) {
    try { await prisma.setting.delete({ where: { key: KEY } }) } catch {}
    return NextResponse.json({ success: true })
  }

  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: link },
    create: { key: KEY, value: link },
  })

  return NextResponse.json({ success: true })
}
