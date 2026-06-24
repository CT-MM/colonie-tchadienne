'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tchad-blue via-tchad-blue-dark to-tchad-blue relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/3 h-full bg-tchad-blue opacity-80" />
        <div className="absolute top-0 left-1/3 w-1/3 h-full bg-tchad-yellow opacity-10" />
        <div className="absolute top-0 left-2/3 w-1/3 h-full bg-tchad-red opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-tchad-yellow rounded-full mb-4 shadow-lg">
            <span className="text-tchad-blue font-black text-2xl">CT</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Colonie Tchadienne</h1>
          <p className="text-white/60 mt-1">Moanda & Mounana — Gabon</p>
          {/* Flag stripe */}
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 rounded-full overflow-hidden flex">
              <div className="h-full w-1/3 bg-blue-400" />
              <div className="h-full w-1/3 bg-tchad-yellow" />
              <div className="h-full w-1/3 bg-tchad-red" />
            </div>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Connexion</h2>

          {error && (
            <div className="bg-red-50 text-tchad-red text-sm p-3 rounded-lg mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@colonie-tchad.ga"
                required
              />
            </div>

            <div>
              <label className="label-field">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              <LogIn size={18} />
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-tchad-blue hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Base de données — Colonie Tchadienne
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
