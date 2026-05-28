import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { token },
    include: { avaliador: true, avaliado: true, obra: true },
  })
  if (!avaliacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(avaliacao)
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const avaliacao = await prisma.avaliacao.findUnique({ where: { token } })
  if (!avaliacao) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (avaliacao.status === 'concluida') return NextResponse.json({ error: 'Já respondido' }, { status: 400 })

  const body = await req.json()
  const updated = await prisma.avaliacao.update({
    where: { token },
    data: {
      q1: body.q1, q2: body.q2, q3: body.q3, q4: body.q4,
      q5: body.q5, q6: body.q6, q7: body.q7,
      status: 'concluida',
      respondidoEm: new Date(),
    },
  })
  return NextResponse.json(updated)
}
