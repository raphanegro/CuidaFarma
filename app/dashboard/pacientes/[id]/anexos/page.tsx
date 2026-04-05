'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Trash2, FileText, Image, Loader2, AlertCircle } from 'lucide-react'

interface Anexo {
  id: string
  nome: string
  tipo: string
  url: string
  tamanho: number
  descricao?: string
  criadoEm: string
}

const TIPOS: Record<string, string> = {
  LAUDO_EXAME: 'Laudo de Exame',
  RECEITA: 'Receita',
  RELATORIO_MEDICO: 'Relatorio Medico',
  EXAME_IMAGEM: 'Exame de Imagem',
  OUTROS: 'Outros',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AnexosPage() {
  const params = useParams()
  const pacienteId = params.id as string
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [tipoSelecionado, setTipoSelecionado] = useState('OUTROS')
  const [descricao, setDescricao] = useState('')
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchAnexos = async () => {
    try {
      const r = await fetch(`/api/anexos?pacienteId=${pacienteId}`)
      if (r.ok) setAnexos(await r.json())
    } catch {
      setErro('Erro ao carregar anexos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnexos() }, [pacienteId])

  const handleUpload = async (file: File) => {
    setUploading(true)
    setErro('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('pacienteId', pacienteId)
      form.append('tipo', tipoSelecionado)
      if (descricao) form.append('descricao', descricao)

      const r = await fetch('/api/anexos', { method: 'POST', body: form })
      if (!r.ok) {
        const data = await r.json()
        setErro(data.error || 'Erro ao fazer upload')
        return
      }
      setDescricao('')
      await fetchAnexos()
    } catch {
      setErro('Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este anexo?')) return
    await fetch(`/api/anexos/${id}`, { method: 'DELETE' })
    setAnexos((prev) => prev.filter((a) => a.id !== id))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const totalBytes = anexos.reduce((s, a) => s + a.tamanho, 0)
  const limiteBytes = 20 * 1024 * 1024 * 10 // 200MB total (10 files x 20MB)
  const usagePercent = Math.min((totalBytes / limiteBytes) * 100, 100)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/pacientes/${pacienteId}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Anexos do Paciente</h1>
      </div>

      {/* Upload Zone */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Enviar Documento</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de Documento</label>
            <select
              value={tipoSelecionado}
              onChange={(e) => setTipoSelecionado(e.target.value)}
              className="input w-full text-sm"
            >
              {Object.entries(TIPOS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descricao (opcional)</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="input w-full text-sm"
              placeholder="Ex: Hemograma completo jan/2026"
            />
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            drag ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">Arraste um arquivo ou clique para selecionar</p>
              <p className="text-xs text-gray-400">PDF, JPG ou PNG — maximo 20 MB</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }}
        />

        {erro && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        {/* Storage bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Armazenamento: {formatBytes(totalBytes)}</span>
            <span>{anexos.length}/10 arquivos</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full">
            <div
              className={`h-1.5 rounded-full ${usagePercent > 80 ? 'bg-red-400' : 'bg-blue-400'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Listagem */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : anexos.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Nenhum anexo cadastrado
          </div>
        ) : (
          anexos.map((a) => {
            const isPdf = a.nome.toLowerCase().endsWith('.pdf')
            return (
              <div key={a.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    {isPdf ? (
                      <FileText className="h-5 w-5 text-red-500" />
                    ) : (
                      <Image className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.nome}</p>
                    <p className="text-xs text-gray-500">
                      {TIPOS[a.tipo] ?? a.tipo} · {formatBytes(a.tamanho)} ·{' '}
                      {new Date(a.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                    {a.descricao && <p className="text-xs text-gray-400">{a.descricao}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline px-2 py-1"
                  >
                    Visualizar
                  </a>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
