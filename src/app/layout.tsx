'use client'

import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <title>Colonie Tchadienne - Moanda & Mounana</title>
        <meta name="description" content="Base de données de la colonie tchadienne de Moanda et Mounana au Gabon" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🇹🇩</text></svg>" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
