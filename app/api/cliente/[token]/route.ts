import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const avaliacao = await prisma.avaliacaoCliente.findUnique({
    where: { token },
    include: { obra: { select: { nome: true } } },
  })
  if (!avaliacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(avaliacao)
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()

  const avaliacao = await prisma.avaliacaoCliente.findUnique({ where: { token } })
  if (!avaliacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (avaliacao.status === 'concluida') {
    return NextResponse.json({ error: 'Já respondida' }, { status: 409 })
  }

  const updated = await prisma.avaliacaoCliente.update({
    where: { token },
    data: {
      q1: body.q1,
      q2: body.q2,
      q3: body.q3,
      q4: body.q4,
      status: 'concluida',
      respondidoEm: new Date(),
    },
  })
  return NextResponse.json(updated)
}
