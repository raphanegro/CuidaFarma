'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    cpf: '',
    crf: '',
    crfEstado: '',
    senha: '',
    confirmaSenha: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (formData.senha !== formData.confirmaSenha) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.senha.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          sobrenome: formData.sobrenome,
          email: formData.email,
          cpf: formData.cpf,
          crf: formData.crf,
          crfEstado: formData.crfEstado,
          senha: formData.senha,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao criar conta')
        return
      }

      router.push('/login?registered=true')
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            CuidaFarma
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Criar nova conta
          </p>

          {error && (
            <div className="mb-6 flex gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder="João"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label-base">Sobrenome</label>
                <input
                  type="text"
                  name="sobrenome"
                  value={formData.sobrenome}
                  onChange={handleChange}
                  required
                  className="input-base"
                  placeholder="Silva"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label-base">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-base"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label-base">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                className="input-base"
                placeholder="000.000.000-00"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base">CRF</label>
                <input
                  type="text"
                  name="crf"
                  value={formData.crf}
                  onChange={handleChange}
                  className="input-base"
                  placeholder="ex: 12345"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label-base">Estado do CRF</label>
                <select
                  name="crfEstado"
                  value={formData.crfEstado}
                  onChange={(e) => setFormData({ ...formData, crfEstado: e.target.value })}
                  className="input-base"
                  disabled={loading}
                >
                  <option value="">Selecione...</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label-base">Senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                className="input-base"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label-base">Confirmar Senha</label>
              <input
                type="password"
                name="confirmaSenha"
                value={formData.confirmaSenha}
                onChange={handleChange}
                required
                className="input-base"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Já tem conta?{' '}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
