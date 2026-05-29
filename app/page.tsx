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
    fetch('/api/obras').then(r => r.json()).then(d => { setObras(d); setLoading(false) })
  }, [])

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>Obras</h1>
          {!loading && obras.length > 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {obras.length} obra{obras.length !== 1 ? 's' : ''} cadastrada{obras.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link href="/obras/nova" className="btn-primary">
          + Nova Obra
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 14 }}>
          Carregando...
        </div>
      ) : obras.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--teal), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>Nenhuma obra cadastrada</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Comece criando a primeira obra.</p>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {obras.map(obra => (
            <Link key={obra.id} href={`/obras/${obra.id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-interactive" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--teal), var(--blue))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)', marginBottom: 2 }}>{obra.nome}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {formatarMoeda(obra.valorContrato)}
                      <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                      {obra._count.pessoas} pessoa{obra._count.pessoas !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                    background: 'rgba(42,185,176,0.1)', color: 'var(--teal)',
                  }}>
                    {obra._count.avaliacoes} avaliações
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(obra.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
