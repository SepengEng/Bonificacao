import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const obras = await prisma.obra.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { pessoas: true, avaliacoes: true } } },
  })
  return NextResponse.json(obras)
}

export async function POST(req: Request) {
  const body = await req.json()
  const obra = await prisma.obra.create({
    data: {
      nome:          body.nome,
      valorContrato: body.valorContrato,
      custosTotais:  body.custosTotais,
      prazoOpcao:    body.prazoOpcao,
      custoOpcao:    body.custoOpcao,
      clienteMedia:  body.clienteMedia,
      segurancaOk:   body.segurancaOk,
    },
  })
  return NextResponse.json(obra)
}
