'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatarMoeda } from '@/lib/scoring'

interface Obra {
  id: string
  nome: string
  valorContrato: number
  createdAt: string
  _count: { pessoas: number; avaliacoes: number }
}

export default function Dashboard() {
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/obras')
      .then(r => r.json())
      .then(d => { setObras(d); setLoading(false) })
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">Obras</h1>
        <Link href="/obras/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Nova Obra
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-10">Carregando...</p>
      ) : obras.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🏗️</p>
          <p className="font-medium">Nenhuma obra cadastrada.</p>
          <p className="text-sm mt-1">Comece criando a primeira obra.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {obras.map(obra => (
            <Link key={obra.id} href={`/obras/${obra.id}`}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">{obra.nome}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatarMoeda(obra.valorContrato)} · {obra._count.pessoas} pessoa{obra._count.pessoas !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {new Date(obra.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {obra._count.avaliacoes} avaliações
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
