'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Search, Download, FileText } from 'lucide-react'

export interface SmartFilter {
  label: string
  description: string
  params: Record<string, string>
}

interface SmartSearchProps {
  filters: SmartFilter[]
  onApplyFilter: (params: Record<string, string>) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
  placeholder?: string
}

export default function SmartSearch({ filters, onApplyFilter, onExportCSV, onExportPDF, placeholder }: SmartSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const matched = query.trim()
    ? filters.filter(f =>
        f.label.toLowerCase().includes(query.toLowerCase()) ||
        f.description.toLowerCase().includes(query.toLowerCase())
      )
    : filters

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl cursor-pointer hover:border-purple-300 transition-colors"
      >
        <Sparkles size={16} className="text-purple-500" />
        <span className="text-sm text-purple-700 font-medium">Recherche intelligente</span>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 w-[360px] max-h-[70vh] flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-purple-500" />
                Filtres intelligents
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder || 'Rechercher un filtre...'}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-300"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {matched.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun filtre trouvé</p>
            ) : (
              <div className="space-y-1">
                {matched.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onApplyFilter(f.params)
                      setOpen(false)
                      setQuery('')
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-purple-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-gray-800 group-hover:text-purple-700">{f.label}</p>
                    <p className="text-xs text-gray-400">{f.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {(onExportCSV || onExportPDF) && (
            <div className="p-2 border-t border-gray-100 flex gap-2">
              {onExportPDF && (
                <button onClick={() => { onExportPDF(); setOpen(false) }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FileText size={13} /> Exporter PDF
                </button>
              )}
              {onExportCSV && (
                <button onClick={() => { onExportCSV(); setOpen(false) }} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Download size={13} /> Exporter CSV
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
