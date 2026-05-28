import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const avaliacoes = await prisma.avaliacaoCliente.findMany({
    where: { obraId: id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(avaliacoes)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const token = randomBytes(6).toString('hex')
  const avaliacao = await prisma.avaliacaoCliente.create({
    data: {
      token,
      obraId: id,
      label: body.label ?? null,
    },
  })
  return NextResponse.json(avaliacao)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: _obraId } = await params
  const { searchParams } = new URL(req.url)
  const avaliacaoId = searchParams.get('avaliacaoId')
  if (!avaliacaoId) return NextResponse.json({ error: 'avaliacaoId required' }, { status: 400 })
  await prisma.avaliacaoCliente.delete({ where: { id: avaliacaoId } })
  return NextResponse.json({ ok: true })
}
