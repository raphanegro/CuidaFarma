'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, Clock, X } from 'lucide-react'

interface Paciente {
  id: string
  nome: string
  sobrenome: string
  cpf: string
}

const BUSCA_KEY = 'cuidafarma:buscas_recentes'

function getRecentes(): string[] {
  try { return JSON.parse(localStorage.getItem(BUSCA_KEY) || '[]') } catch { return [] }
}

function salvarRecente(termo: string) {
  if (!termo.trim()) return
  const lista = getRecentes().filter((b) => b !== termo)
  localStorage.setItem(BUSCA_KEY, JSON.stringify([termo, ...lista].slice(0, 5)))
}

export default function OmniSearch() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Paciente[]>([])
  const [recentes, setRecentes] = useState<string[]>([])
  const [aberto, setAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setRecentes(getRecentes())
  }, [])

  const buscar = useCallback(async (termo: string) => {
    if (!termo.trim()) { setResultados([]); return }
    setCarregando(true)
    try {
      const res = await fetch(`/api/pacientes?search=${encodeURIComponent(termo)}`)
      if (res.ok) setResultados((await res.json()).slice(0, 6))
    } catch { /* silent */ } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => buscar(query), 300)
    return () => clearTimeout(t)
  }, [query, buscar])

  const navegar = (paciente: Paciente) => {
    salvarRecente(`${paciente.nome} ${paciente.sobrenome}`)
    setRecentes(getRecentes())
    setQuery('')
    setAberto(false)
    router.push(`/dashboard/pacientes/${paciente.id}`)
  }

  const aplicarRecente = (termo: string) => {
    setQuery(termo)
    inputRef.current?.focus()
  }

  const limparRecentes = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.removeItem(BUSCA_KEY)
    setRecentes([])
  }

  const fechar = () => {
    setAberto(false)
    setQuery('')
    setResultados([])
  }

  const mostrarDropdown = aberto && (query.length > 0 || recentes.length > 0)

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar paciente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(fechar, 150)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-blue-300 focus:outline-none transition-all"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {mostrarDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* Resultados da busca */}
          {query.length > 0 && (
            <>
              {carregando && (
                <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
              )}
              {!carregando && resultados.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">Nenhum paciente encontrado</div>
              )}
              {!carregando && resultados.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={() => navegar(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.nome} {p.sobrenome}</p>
                    <p className="text-xs text-gray-400">{p.cpf}</p>
                  </div>
                </button>
              ))}
              {!carregando && resultados.length > 0 && (
                <button
                  onMouseDown={() => { router.push(`/dashboard/pacientes?search=${encodeURIComponent(query)}`); fechar() }}
                  className="w-full px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 border-t border-gray-100 text-center"
                >
                  Ver todos os resultados para "{query}"
                </button>
              )}
            </>
          )}

          {/* Buscas recentes (só quando campo vazio) */}
          {query.length === 0 && recentes.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">Buscas recentes</span>
                <button onMouseDown={limparRecentes} className="text-xs text-red-500 hover:text-red-700">Limpar</button>
              </div>
              {recentes.map((b) => (
                <button
                  key={b}
                  onMouseDown={() => aplicarRecente(b)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                >
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{b}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
