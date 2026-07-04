'use client'

import { useState } from 'react'
import { CreditCard, Search, Lock, Phone, Eye, EyeOff, ArrowLeft, User, DollarSign, Users, BookOpen, Calendar, MapPin, Clock, LogOut, Shield, KeyRound, Crown, Scale, MessageCircle } from 'lucide-react'

type Step = 'search' | 'create-pin' | 'login' | 'reset-pin' | 'dashboard'

export default function PortailPage() {
  const [step, setStep] = useState<Step>('search')
  const [numero, setNumero] = useState('')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [telephone, setTelephone] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [citoyenInfo, setCitoyenInfo] = useState<any>(null)
  const [dashData, setDashData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('infos')

  const handleSearch = async () => {
    if (!numero.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/portail?numero=${encodeURIComponent(numero.trim())}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setCitoyenInfo(data)
      if (data.hasPin) {
        setStep('login')
      } else {
        setStep('create-pin')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePin = async () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError('Le code PIN doit contenir exactement 6 chiffres')
      return
    }
    if (newPin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portail/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numero.trim(), pin: newPin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setPin(newPin)
      await handleLogin(newPin)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (pinOverride?: string) => {
    const pinToUse = pinOverride || pin
    if (pinToUse.length !== 6) {
      setError('Le code PIN doit contenir 6 chiffres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portail/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numero.trim(), pin: pinToUse }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setDashData(data)
      setStep('dashboard')
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPin = async () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError('Le code PIN doit contenir exactement 6 chiffres')
      return
    }
    if (newPin !== confirmPin) {
      setError('Les codes PIN ne correspondent pas')
      return
    }
    if (!telephone.trim()) {
      setError('Entrez votre numéro de téléphone')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/portail/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero: numero.trim(), telephone: telephone.trim(), newPin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setPin(newPin)
      await handleLogin(newPin)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setStep('search')
    setNumero('')
    setPin('')
    setNewPin('')
    setConfirmPin('')
    setTelephone('')
    setError('')
    setCitoyenInfo(null)
    setDashData(null)
    setActiveTab('infos')
  }

  if (step === 'dashboard' && dashData) {
    return <Dashboard data={dashData} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a4d] via-[#002664] to-[#001233] flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FECB00] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-[#002664] font-black text-xl">CT</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Colonie Tchadienne</h1>
        <p className="text-white/60 text-sm">Lebombi-Leyou — Portail membre</p>
        <div className="flex gap-1 justify-center mt-2">
          <div className="w-6 h-1 bg-[#002664] rounded" />
          <div className="w-6 h-1 bg-[#FECB00] rounded" />
          <div className="w-6 h-1 bg-[#C60C30] rounded" />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">

        {/* Step: Search */}
        {step === 'search' && (
          <>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-1">Accéder à mon espace</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Entrez votre numéro de carte de colonie</p>
            <div className="relative mb-4">
              <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={numero}
                onChange={(e) => {
                  let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  if (v.length > 2 && !v.startsWith('CT')) v = 'CT' + v.replace(/^CT/, '')
                  if (v.length > 2) v = v.slice(0, 2) + '-' + v.slice(2)
                  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5)
                  if (v.length > 9) v = v.slice(0, 9)
                  setNumero(v); setError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none text-center font-mono font-bold tracking-wider"
                placeholder="CT-MM-001"
              />
            </div>
            {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4 text-center">{error}</div>}
            <button
              onClick={handleSearch}
              disabled={!numero.trim() || loading}
              className="w-full py-3 bg-[#002664] text-white font-semibold rounded-xl hover:bg-[#001a4d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={18} />}
              Rechercher
            </button>
          </>
        )}

        {/* Step: Create PIN */}
        {step === 'create-pin' && (
          <>
            <button onClick={() => { setStep('search'); setError('') }} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm">
              <ArrowLeft size={16} /> Retour
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield size={24} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Bienvenue {citoyenInfo?.prenom} !</h2>
              <p className="text-gray-400 text-sm mt-1">Créez votre code PIN à 6 chiffres pour sécuriser votre espace</p>
            </div>
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setNewPin(v); setError('') }}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none text-center font-mono tracking-[0.5em] text-lg"
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                />
                <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setConfirmPin(v); setError('') }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none text-center font-mono tracking-[0.5em] text-lg"
                  placeholder="Confirmez"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
            {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4 text-center">{error}</div>}
            <button
              onClick={handleCreatePin}
              disabled={newPin.length !== 6 || confirmPin.length !== 6 || loading}
              className="w-full py-3 bg-[#002664] text-white font-semibold rounded-xl hover:bg-[#001a4d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={18} />}
              Créer mon code PIN
            </button>
          </>
        )}

        {/* Step: Login */}
        {step === 'login' && (
          <>
            <button onClick={() => { setStep('search'); setError(''); setPin('') }} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm">
              <ArrowLeft size={16} /> Retour
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-[#002664]" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Bonjour {citoyenInfo?.prenom} !</h2>
              <p className="text-gray-400 text-sm mt-1">Entrez votre code PIN à 6 chiffres</p>
            </div>
            <div className="relative mb-4">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setPin(v); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && pin.length === 6 && handleLogin()}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none text-center font-mono tracking-[0.5em] text-lg"
                placeholder="••••••"
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
              <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4 text-center">{error}</div>}
            <button
              onClick={() => handleLogin()}
              disabled={pin.length !== 6 || loading}
              className="w-full py-3 bg-[#002664] text-white font-semibold rounded-xl hover:bg-[#001a4d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={18} />}
              Connexion
            </button>
            <button
              onClick={() => { setStep('reset-pin'); setError(''); setNewPin(''); setConfirmPin(''); setTelephone('') }}
              className="w-full mt-3 text-sm text-[#002664] hover:underline text-center"
            >
              Code PIN oublié ?
            </button>
          </>
        )}

        {/* Step: Reset PIN */}
        {step === 'reset-pin' && (
          <>
            <button onClick={() => { setStep('login'); setError('') }} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm">
              <ArrowLeft size={16} /> Retour
            </button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Réinitialiser le code PIN</h2>
              <p className="text-gray-400 text-sm mt-1">
                Vérifiez votre identité avec le numéro de téléphone enregistré
                {citoyenInfo?.telephoneMasque && (
                  <span className="block font-mono mt-1 text-gray-600">{citoyenInfo.telephoneMasque}</span>
                )}
              </p>
            </div>
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => { setTelephone(e.target.value); setError('') }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none"
                  placeholder="Votre numéro de téléphone"
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={newPin}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setNewPin(v); setError('') }}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none text-center font-mono tracking-[0.5em] text-lg"
                  placeholder="Nouveau PIN"
                  maxLength={6}
                  inputMode="numeric"
                />
                <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setConfirmPin(v); setError('') }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#002664] focus:ring-0 outline-none text-center font-mono tracking-[0.5em] text-lg"
                  placeholder="Confirmez"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
            {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3 mb-4 text-center">{error}</div>}
            <button
              onClick={handleResetPin}
              disabled={newPin.length !== 6 || confirmPin.length !== 6 || !telephone.trim() || loading}
              className="w-full py-3 bg-[#002664] text-white font-semibold rounded-xl hover:bg-[#001a4d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound size={18} />}
              Réinitialiser
            </button>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <a href="/login" className="text-sm text-[#002664]/60 hover:text-[#002664] transition">
            Accès administrateur / Bureau
          </a>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ data, activeTab, setActiveTab, onLogout }: { data: any; activeTab: string; setActiveTab: (t: string) => void; onLogout: () => void }) {
  const c = data.citoyen
  const groupLink = data.groupLink
  const tabs = [
    { id: 'infos', label: 'Mes infos', icon: User },
    { id: 'cotisations', label: 'Cotisations', icon: DollarSign },
    { id: 'bureau', label: 'Bureau', icon: Users },
    { id: 'charte', label: 'Charte', icon: BookOpen },
    { id: 'evenements', label: 'Événements', icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#002664] text-white px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {c.photo ? (
              <img src={c.photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#FECB00]" />
            ) : (
              <div className="w-10 h-10 bg-[#FECB00]/20 rounded-full flex items-center justify-center">
                <User size={20} className="text-[#FECB00]" />
              </div>
            )}
            <div>
              <p className="font-bold text-sm">{c.prenom} {c.nom}</p>
              <p className="text-white/50 text-xs font-mono">{c.numeroCarte}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {groupLink && (
              <a
                href={groupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MessageCircle size={16} />
                <span className="hidden sm:inline">Groupe WhatsApp</span>
              </a>
            )}
            <button onClick={onLogout} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
              <LogOut size={16} /> Quitter
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'border-[#002664] text-[#002664]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp Group Banner */}
      {groupLink && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
          <a
            href={groupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-colors"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-green-800 text-sm">Rejoindre le groupe WhatsApp</p>
              <p className="text-xs text-green-600">Restez informé des actualités de la colonie</p>
            </div>
            <span className="text-green-600 font-medium text-sm flex-shrink-0">Rejoindre →</span>
          </a>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {activeTab === 'infos' && <TabInfos citoyen={c} />}
        {activeTab === 'cotisations' && <TabCotisations contributions={data.contributions} total={data.totalContributions} />}
        {activeTab === 'bureau' && <TabBureau bureau={data.bureau} />}
        {activeTab === 'charte' && <TabCharte charte={data.charte} />}
        {activeTab === 'evenements' && <TabEvenements evenements={data.evenements} />}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function TabInfos({ citoyen: c }: { citoyen: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          {c.photo ? (
            <img src={c.photo} alt="" className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
              <User size={32} className="text-gray-300" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{c.prenom} {c.nom}</h2>
            <p className="text-sm text-[#002664] font-mono">{c.numeroCarte}</p>
            {c.situationRegularite && (
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                c.situationRegularite === 'Régulier' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {c.situationRegularite}
              </span>
            )}
          </div>
        </div>
        <InfoRow label="Date de naissance" value={c.dateNaissance} />
        <InfoRow label="Lieu de naissance" value={c.lieuNaissance} />
        <InfoRow label="Sexe" value={c.sexe === 'M' ? 'Masculin' : c.sexe === 'F' ? 'Féminin' : c.sexe} />
        <InfoRow label="Ville" value={c.ville} />
        <InfoRow label="Quartier" value={c.quartier} />
        <InfoRow label="Téléphone" value={c.telephone} />
        <InfoRow label="Profession" value={c.profession} />
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Documents</h3>
        <InfoRow label="Carte de séjour" value={c.carteSejour} />
        <InfoRow label="Carte de colonie" value={c.carteColonie} />
        <InfoRow label="Passeport" value={c.passeport} />
      </div>
    </div>
  )
}

function TabCotisations({ contributions, total }: { contributions: any[]; total: number }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#002664] text-white rounded-xl p-5 shadow-sm">
        <p className="text-white/60 text-sm">Total de vos cotisations</p>
        <p className="text-3xl font-bold mt-1">{total.toLocaleString()} FCFA</p>
        <p className="text-white/40 text-xs mt-1">{contributions.length} versement{contributions.length > 1 ? 's' : ''}</p>
      </div>
      {contributions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
          <p>Aucune cotisation enregistrée</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {contributions.map((co: any) => (
            <div key={co.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{co.montant.toLocaleString()} FCFA</p>
                <p className="text-xs text-gray-400">{new Date(co.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              {co.motif && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{co.motif}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabBureau({ bureau }: { bureau: any[] }) {
  if (!bureau.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Users size={40} className="mx-auto mb-2 opacity-30" />
        <p>Bureau exécutif non défini</p>
      </div>
    )
  }

  const sections = [
    { key: 'executif', label: 'Bureau Exécutif', icon: Crown, color: 'text-[#002664]', bg: 'bg-[#002664]/10' },
    { key: 'religieux', label: 'Conseil Religieux', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { key: 'conseiller', label: 'Conseillers', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-100' },
  ]

  return (
    <div className="space-y-6">
      {sections.map((sec) => {
        const members = bureau.filter((m: any) => (m.categorie || 'executif') === sec.key)
        if (!members.length) return null
        return (
          <div key={sec.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 ${sec.bg} rounded-lg flex items-center justify-center`}>
                <sec.icon size={16} className={sec.color} />
              </div>
              <h3 className="font-bold text-gray-900">{sec.label}</h3>
              <span className="text-xs text-gray-400">({members.length})</span>
            </div>
            <div className="space-y-2">
              {members.map((m: any) => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                  {m.citoyen?.photo ? (
                    <img src={m.citoyen.photo} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className={`w-14 h-14 ${sec.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <User size={24} className={sec.color} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{m.citoyen?.prenom} {m.citoyen?.nom}</p>
                    <p className={`text-sm font-semibold ${sec.color}`}>{m.fonction}</p>
                    {m.citoyen?.ville && <p className="text-xs text-gray-400">{m.citoyen.ville}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {m.citoyen?.telephone && (
                      <a href={`tel:${m.citoyen.telephone}`} className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition">
                        <Phone size={16} className="text-green-600" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TabCharte({ charte }: { charte: string | null }) {
  if (!charte) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
        <p>La charte n&apos;est pas encore disponible</p>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-3">Charte de la Colonie Tchadienne</h3>
      <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{charte}</div>
    </div>
  )
}

function TabEvenements({ evenements }: { evenements: any[] }) {
  if (!evenements.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Calendar size={40} className="mx-auto mb-2 opacity-30" />
        <p>Aucun événement à venir</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {evenements.map((ev: any) => (
        <div key={ev.id} className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-[#002664]/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-[#002664] leading-none">
                {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
              </span>
              <span className="text-xs text-[#002664]/60 uppercase mt-0.5">
                {new Date(ev.date).toLocaleDateString('fr-FR', { month: 'short' })}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{ev.titre}</h3>
              {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                {ev.heure && <span className="flex items-center gap-1"><Clock size={12} />{ev.heure}</span>}
                {ev.lieu && <span className="flex items-center gap-1"><MapPin size={12} />{ev.lieu}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
