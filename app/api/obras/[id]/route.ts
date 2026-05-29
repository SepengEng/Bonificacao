import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const obra = await prisma.obra.findUnique({
    where: { id },
    include: {
      pessoas: { orderBy: { setor: 'asc' } },
      avaliacoes: {
        include: { avaliador: true, avaliado: true },
        orderBy: { createdAt: 'asc' },
      },
      avaliacoesCliente: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!obra) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(obra)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.nome          !== undefined) data.nome          = body.nome
  if (body.valorContrato !== undefined) data.valorContrato = Number(body.valorContrato)
  if (body.custosTotais  !== undefined) data.custosTotais  = Number(body.custosTotais)
  if (body.prazoOpcao    !== undefined) data.prazoOpcao    = body.prazoOpcao
  if (body.custoOpcao    !== undefined) data.custoOpcao    = body.custoOpcao
  if (body.clienteMedia  !== undefined) data.clienteMedia  = Number(body.clienteMedia)
  if (body.segurancaOk   !== undefined) data.segurancaOk   = Boolean(body.segurancaOk)
  const obra = await prisma.obra.update({ where: { id }, data })
  return NextResponse.json(obra)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.obra.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
