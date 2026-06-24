import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'platform_logo' } })
    if (setting?.value) {
      const match = setting.value.match(/^data:(image\/\w+);base64,(.+)$/)
      if (match) {
        const buffer = Buffer.from(match[2], 'base64')
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': match[1],
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    }
  } catch {}

  return NextResponse.redirect(new URL('/icons/icon-512.svg', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
}
