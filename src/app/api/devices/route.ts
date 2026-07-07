import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const devices = await prisma.device.findMany({
    where: { userId },
    orderBy: { lastActive: 'desc' },
  })

  return NextResponse.json({ devices })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { deviceId } = await req.json()
  const userId = (session.user as any).id

  if (deviceId === 'all') {
    await prisma.device.deleteMany({ where: { userId } })
    await prisma.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    })
    return NextResponse.json({ success: true, forceLogout: true })
  }

  await prisma.device.delete({ where: { id: deviceId, userId } })
  return NextResponse.json({ success: true })
}
