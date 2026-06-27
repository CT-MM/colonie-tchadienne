'use client'

import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <title>Colonie Tchadienne - Lebombi-Leyou</title>
        <meta name="description" content="Base de données de la Colonie Tchadienne de la Lebombi-Leyou au Gabon" />
        <meta name="theme-color" content="#002664" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Colonie Tchad" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/api/settings/pwa-icon" />
        <link rel="apple-touch-icon" href="/api/settings/pwa-icon" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <SessionProvider>
          {children}
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`,
          }}
        />
      </body>
    </html>
  )
}
