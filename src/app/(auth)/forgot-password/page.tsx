'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, Phone, Mail, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !telephone || !newPassword) {
      setError('Tous les champs sont requis')
      return
    }

    if (newPassword.length < 4) {
      setError('Le mot de passe doit contenir au moins 4 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, telephone, newPassword }),
    })

    const data = await res.json()
    if (res.ok) {
      setStep('success')
    } else {
      setError(data.error || 'Une erreur est survenue')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tchad-blue via-tchad-blue-dark to-tchad-blue relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/3 h-full bg-tchad-blue opacity-80" />
        <div className="absolute top-0 left-1/3 w-1/3 h-full bg-tchad-yellow opacity-10" />
        <div className="absolute top-0 left-2/3 w-1/3 h-full bg-tchad-red opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-tchad-yellow rounded-full mb-4 shadow-lg">
            <KeyRound size={32} className="text-tchad-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-white/60 mt-1">Confirmez votre identité pour réinitialiser</p>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 rounded-full overflow-hidden flex">
              <div className="h-full w-1/3 bg-blue-400" />
              <div className="h-full w-1/3 bg-tchad-yellow" />
              <div className="h-full w-1/3 bg-tchad-red" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'success' ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Mot de passe modifié</h2>
              <p className="text-gray-500 text-sm mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Réinitialisation</h2>
              <p className="text-gray-400 text-xs text-center mb-6">
                Saisissez votre email et confirmez avec le numéro de téléphone enregistré dans votre fiche membre.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-field">Email du compte</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label-field">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Ex: 077 12 34 56"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Le numéro enregistré dans votre fiche membre</p>
                </div>

                <div>
                  <label className="label-field">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                <div>
                  <label className="label-field">Confirmer le mot de passe</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                >
                  <KeyRound size={18} />
                  {loading ? 'Vérification...' : 'Réinitialiser le mot de passe'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="text-sm text-tchad-blue hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}

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
