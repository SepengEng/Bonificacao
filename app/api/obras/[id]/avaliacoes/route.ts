import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { avaliadorId, avaliadoId } = await req.json()

  const existe = await prisma.avaliacao.findFirst({
    where: { obraId: id, avaliadorId, avaliadoId },
  })
  if (existe) {
    return NextResponse.json({ error: 'Este par já existe.' }, { status: 409 })
  }

  const token = randomBytes(6).toString('hex')
  const avaliacao = await prisma.avaliacao.create({
    data: { token, obraId: id, avaliadorId, avaliadoId },
    include: { avaliador: true, avaliado: true },
  })
  return NextResponse.json(avaliacao)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const avaliacaoId = searchParams.get('avaliacaoId')
  const grupoToken  = searchParams.get('grupoToken')

  if (grupoToken) {
    await prisma.avaliacao.deleteMany({ where: { obraId: id, grupoToken } })
    return NextResponse.json({ ok: true })
  }
  if (avaliacaoId) {
    await prisma.avaliacao.delete({ where: { id: avaliacaoId } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Missing avaliacaoId or grupoToken' }, { status: 400 })
}
