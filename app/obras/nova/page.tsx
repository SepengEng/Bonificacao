'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRAZO_OPCOES, CUSTO_OPCOES } from '@/lib/scoring'

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
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
    <div className="max-w-2xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <h1 className="text-xl font-bold text-gray-900">Nova Obra</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <Field label="Nome da obra">
          <input className={inp} value={form.nome} onChange={e => set('nome', e.target.value)}
            placeholder="Ex: BYD – PISO 25.000 m³" required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor do contrato (R$)" hint="Somente números. Ex: 2825000">
            <input className={inp} type="number" min="0" step="0.01" value={form.valorContrato}
              onChange={e => set('valorContrato', e.target.value)} placeholder="2825000" required />
          </Field>
          <Field label="Custos totais (R$)" hint="Somente números. Ex: 2282000">
            <input className={inp} type="number" min="0" step="0.01" value={form.custosTotais}
              onChange={e => set('custosTotais', e.target.value)} placeholder="2282000" required />
          </Field>
        </div>

        <Field label="Situação do Prazo">
          <select className={inp} value={form.prazoOpcao} onChange={e => set('prazoOpcao', e.target.value)}>
            {Object.entries(PRAZO_OPCOES).map(([k, v]) => (
              <option key={k} value={k}>{v.label} — {v.pontos} pts</option>
            ))}
          </select>
        </Field>

        <Field label="Situação do Custo">
          <select className={inp} value={form.custoOpcao} onChange={e => set('custoOpcao', e.target.value)}>
            {Object.entries(CUSTO_OPCOES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}{!v.eliminatorio ? ` — ${v.pontos} pts` : ''}</option>
            ))}
          </select>
        </Field>

        <Field label="Média NPS do Cliente (0 a 5)" hint="Média das notas dadas pelos clientes às perguntas de satisfação">
          <input className={inp} type="number" min="0" max="5" step="0.01" value={form.clienteMedia}
            onChange={e => set('clienteMedia', e.target.value)} placeholder="Ex: 4.2" required />
        </Field>

        <Field label="Segurança no trabalho">
          <div className="flex gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={form.segurancaOk === true}
                onChange={() => set('segurancaOk', true)} className="accent-blue-600" />
              Todos os critérios atendidos (15 pts)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={form.segurancaOk === false}
                onChange={() => set('segurancaOk', false)} className="accent-blue-600" />
              Algum critério violado (0 pts)
            </label>
          </div>
        </Field>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Criando...' : 'Criar Obra →'}
        </button>
      </form>
    </div>
  )
}
