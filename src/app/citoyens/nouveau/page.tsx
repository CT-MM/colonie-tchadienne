'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import CitoyenForm from '@/components/CitoyenForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NouveauCitoyenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.push('/')
    }
  }, [status, session, router])

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="mb-6">
          <Link href="/citoyens" className="text-tchad-blue hover:underline text-sm flex items-center gap-1 mb-2">
            <ArrowLeft size={16} />
            Retour à la liste
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau citoyen</h1>
          <p className="text-gray-500">Enregistrer un nouveau membre de la communauté</p>
        </div>
        <CitoyenForm />
      </main>
    </div>
  )
}
