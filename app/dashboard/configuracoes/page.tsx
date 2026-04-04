'use client'

import { useState, useEffect } from 'react'
import { Settings, Key, Save, Loader2, CheckCircle, AlertCircle, Bot } from 'lucide-react'
import { MODEL_OPTIONS } from '@/lib/ai-providers'

interface IAConfig {
  provedorPadrao: string
  modeloPadrao: string
  groqApiKey: string | null
  geminiApiKey: string | null
  temGroq: boolean
  temGemini: boolean
}

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [config, setConfig] = useState<IAConfig>({
    provedorPadrao: 'anthropic',
    modeloPadrao: 'claude-sonnet-4-6',
    groqApiKey: null,
    geminiApiKey: null,
    temGroq: false,
    temGemini: false,
  })

  const [groqKeyInput, setGroqKeyInput] = useState('')
  const [geminiKeyInput, setGeminiKeyInput] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/configuracoes/ia')
      if (!res.ok) throw new Error('Erro ao carregar configurações')
      const data = await res.json()
      setConfig(data)
    } catch {
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const body: Record<string, string | null> = {
        provedorPadrao: config.provedorPadrao,
        modeloPadrao: config.modeloPadrao,
      }

      // Only include keys if user typed something (new key or '' to clear)
      if (groqKeyInput !== '') {
        body.groqApiKey = groqKeyInput || null
      } else {
        // send masked value to signal "keep existing"
        body.groqApiKey = config.groqApiKey
      }

      if (geminiKeyInput !== '') {
        body.geminiApiKey = geminiKeyInput || null
      } else {
        body.geminiApiKey = config.geminiApiKey
      }

      const res = await fetch('/api/configuracoes/ia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      setSuccess(true)
      setGroqKeyInput('')
      setGeminiKeyInput('')
      await fetchConfig()

      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const modelsForProvider = MODEL_OPTIONS.filter(
    (m) => m.provider === config.provedorPadrao
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-8 w-8 text-gray-700" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações de inteligência artificial</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* IA Provider Config */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Inteligência Artificial</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-base">Provedor Padrão</label>
            <select
              value={config.provedorPadrao}
              onChange={(e) => {
                const provider = e.target.value
                const firstModel = MODEL_OPTIONS.find((m) => m.provider === provider)
                setConfig({
                  ...config,
                  provedorPadrao: provider,
                  modeloPadrao: firstModel?.model ?? config.modeloPadrao,
                })
              }}
              className="input-base"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="groq">Groq</option>
              <option value="gemini">Google (Gemini / Gemma)</option>
            </select>
          </div>

          <div>
            <label className="label-base">Modelo Padrão</label>
            <select
              value={config.modeloPadrao}
              onChange={(e) => setConfig({ ...config, modeloPadrao: e.target.value })}
              className="input-base"
            >
              {modelsForProvider.map((m) => (
                <option key={m.model} value={m.model}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {config.provedorPadrao === 'anthropic' && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              A chave da Anthropic é gerenciada pelo administrador do sistema via variável de ambiente.
              Nenhuma configuração adicional necessária.
            </p>
          </div>
        )}
      </div>

      {/* Groq API Key */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Key className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Groq API Key</h2>
          {config.temGroq && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Configurada
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Necessária para usar modelos LLaMA, Mixtral e Gemma via Groq.
        </p>

        {config.temGroq && (
          <p className="text-sm text-gray-600 mb-3">
            Chave atual: <span className="font-mono">{config.groqApiKey}</span>
          </p>
        )}

        <div>
          <label className="label-base">
            {config.temGroq ? 'Nova chave (deixe vazio para manter)' : 'Chave API'}
          </label>
          <input
            type="password"
            value={groqKeyInput}
            onChange={(e) => setGroqKeyInput(e.target.value)}
            placeholder={config.temGroq ? 'Digite para substituir...' : 'gsk_...'}
            className="input-base font-mono"
            autoComplete="off"
          />
        </div>

        {config.temGroq && (
          <button
            type="button"
            onClick={() => setGroqKeyInput('')}
            className="mt-2 text-xs text-red-500 hover:text-red-600"
          >
            Remover chave Groq
          </button>
        )}
      </div>

      {/* Gemini API Key */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Key className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">Google AI API Key</h2>
          {config.temGemini && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Configurada
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Necessária para usar Gemini 2.5 Flash/Pro e Gemma 4 (Google AI Studio).
        </p>

        {config.temGemini && (
          <p className="text-sm text-gray-600 mb-3">
            Chave atual: <span className="font-mono">{config.geminiApiKey}</span>
          </p>
        )}

        <div>
          <label className="label-base">
            {config.temGemini ? 'Nova chave (deixe vazio para manter)' : 'Chave API'}
          </label>
          <input
            type="password"
            value={geminiKeyInput}
            onChange={(e) => setGeminiKeyInput(e.target.value)}
            placeholder={config.temGemini ? 'Digite para substituir...' : 'AIza...'}
            className="input-base font-mono"
            autoComplete="off"
          />
        </div>

        {config.temGemini && (
          <button
            type="button"
            onClick={() => setGeminiKeyInput('')}
            className="mt-2 text-xs text-red-500 hover:text-red-600"
          >
            Remover chave Google AI
          </button>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  )
}
