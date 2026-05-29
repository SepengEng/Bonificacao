'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRAZO_OPCOES, CUSTO_OPCOES } from '@/lib/scoring'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 4 }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{hint}</p>}
      {children}
    </div>
  )
}

export default function NovaObra() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    valorContrato: '',
    custosTotais: '',
    prazoOpcao: 'no_prazo',
    custoOpcao: 'no_custo',
    clienteMedia: '',
    segurancaOk: true,
  })

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        valorContrato: parseFloat(form.valorContrato),
        custosTotais: parseFloat(form.custosTotais),
        prazoOpcao: form.prazoOpcao,
        custoOpcao: form.custoOpcao,
        clienteMedia: parseFloat(form.clienteMedia),
        segurancaOk: form.segurancaOk,
      }),
    })
    const obra = await res.json()
    router.push(`/obras/${obra.id}`)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push('/')}
          style={{ color: 'var(--muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
        >←</button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>Nova Obra</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Nome da obra">
          <input value={form.nome} onChange={e => set('nome', e.target.value)}
            placeholder="Ex: BYD – PISO 25.000 m³" required />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Valor do contrato (R$)" hint="Somente números. Ex: 2825000">
            <input type="number" min="0" step="0.01" value={form.valorContrato}
              onChange={e => set('valorContrato', e.target.value)} placeholder="2825000" required />
          </Field>
          <Field label="Custos totais (R$)" hint="Somente números. Ex: 2282000">
            <input type="number" min="0" step="0.01" value={form.custosTotais}
              onChange={e => set('custosTotais', e.target.value)} placeholder="2282000" required />
          </Field>
        </div>

        <Field label="Situação do Prazo">
          <select value={form.prazoOpcao} onChange={e => set('prazoOpcao', e.target.value)}>
            {Object.entries(PRAZO_OPCOES).map(([k, v]) => (
              <option key={k} value={k}>{v.label} — {v.pontos} pts</option>
            ))}
          </select>
        </Field>

        <Field label="Situação do Custo">
          <select value={form.custoOpcao} onChange={e => set('custoOpcao', e.target.value)}>
            {Object.entries(CUSTO_OPCOES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}{!v.eliminatorio ? ` — ${v.pontos} pts` : ''}</option>
            ))}
          </select>
        </Field>

        <Field label="Média NPS do Cliente (0 a 5)" hint="Média das notas dadas pelos clientes às perguntas de satisfação">
          <input type="number" min="0" max="5" step="0.01" value={form.clienteMedia}
            onChange={e => set('clienteMedia', e.target.value)} placeholder="Ex: 4.2" required />
        </Field>

        <Field label="Segurança no trabalho">
          <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--fg)' }}>
              <input type="radio" checked={form.segurancaOk === true}
                onChange={() => set('segurancaOk', true)}
                style={{ accentColor: 'var(--teal)', width: 'auto' }} />
              Todos os critérios atendidos (15 pts)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--fg)' }}>
              <input type="radio" checked={form.segurancaOk === false}
                onChange={() => set('segurancaOk', false)}
                style={{ accentColor: 'var(--teal)', width: 'auto' }} />
              Algum critério violado (0 pts)
            </label>
          </div>
        </Field>

        <button type="submit" disabled={saving} className="btn-primary"
          style={{ justifyContent: 'center', padding: '10px 18px', width: '100%' }}>
          {saving ? 'Criando...' : 'Criar Obra →'}
        </button>
      </form>
    </div>
  )
}
