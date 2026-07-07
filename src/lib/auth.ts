import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

function parseUA(ua: string) {
  let browser = 'Inconnu', os = 'Inconnu', deviceType = 'Desktop'
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) deviceType = /iPad|Tablet/i.test(ua) ? 'Tablette' : 'Mobile'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome'
  else if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/Opera|OPR/.test(ua)) browser = 'Opera'
  if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS/.test(ua)) os = 'macOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  else if (/Linux/.test(ua)) os = 'Linux'
  return { browser, os, deviceType }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) return null

        const userAgent = (req as any)?.headers?.['user-agent'] || ''
        const forwarded = (req as any)?.headers?.['x-forwarded-for'] || ''
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : ''

        const browser = parseUA(userAgent)

        try {
          await prisma.device.create({
            data: {
              userId: user.id,
              userAgent,
              browser: browser.browser,
              os: browser.os,
              deviceType: browser.deviceType,
              ip: ip || null,
              city: null,
              country: null,
            },
          })

          if (ip && ip !== '127.0.0.1' && ip !== '::1') {
            fetch(`http://ip-api.com/json/${ip}?fields=city,country`)
              .then(r => r.json())
              .then(async (geo) => {
                if (geo.city || geo.country) {
                  const devices = await prisma.device.findMany({
                    where: { userId: user.id, ip },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  })
                  if (devices[0]) {
                    await prisma.device.update({
                      where: { id: devices[0].id },
                      data: { city: geo.city || null, country: geo.country || null },
                    })
                  }
                }
              })
              .catch(() => {})
          }
        } catch {}

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.sessionVersion = (user as any).sessionVersion ?? 0
      }
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { sessionVersion: true },
          })
          if (dbUser && dbUser.sessionVersion !== token.sessionVersion) {
            return { ...token, expired: true }
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if ((token as any).expired) {
        return { ...session, expired: true } as any
      }
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
