import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../baseDatos/prisma/prisma.service';

@Injectable()
export class ConversacionService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(usuarioId: number, institucionId: number) {
    return this.prisma.conversacionChat.create({
      data: { usuarioId, institucionId },
    });
  }

  async listar(usuarioId: number) {
    return this.prisma.conversacionChat.findMany({
      where: { usuarioId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        titulo: true,
        resumen: true,
        temas: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async obtenerUna(id: number, usuarioId: number) {
    const conversacion = await this.prisma.conversacionChat.findFirst({
      where: { id, usuarioId },
    });

    if (!conversacion) {
      throw new NotFoundException('Conversación no encontrada');
    }

    return conversacion;
  }

  async actualizarResumen(
    id: number,
    usuarioId: number,
    data: { titulo?: string; resumen?: string; temas?: string[] },
  ) {
    const conversacion = await this.prisma.conversacionChat.findFirst({
      where: { id, usuarioId },
    });

    if (!conversacion) {
      throw new NotFoundException('Conversación no encontrada');
    }

    const updateData: any = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.resumen !== undefined) updateData.resumen = data.resumen;
    if (data.temas !== undefined) updateData.temas = data.temas;

    return this.prisma.conversacionChat.update({
      where: { id },
      data: updateData,
    });
  }

  async registrarIntereses(usuarioId: number, temas: string[]) {
    const temasNormalizados = this.normalizarTemas(temas);

    for (const tema of temasNormalizados) {
      const existente = await this.prisma.interesUsuario.findUnique({
        where: { usuarioId_tema: { usuarioId, tema } },
      });

      if (existente) {
        await this.prisma.interesUsuario.update({
          where: { id: existente.id },
          data: {
            peso: { increment: 1 },
            ultimaConsulta: new Date(),
          },
        });
      } else {
        await this.prisma.interesUsuario.create({
          data: { usuarioId, tema },
        });
      }
    }
  }

  async obtenerIntereses(usuarioId: number) {
    return this.prisma.interesUsuario.findMany({
      where: { usuarioId },
      orderBy: { peso: 'desc' },
      take: 20,
    });
  }

  async eliminar(id: number, usuarioId: number) {
    const conversacion = await this.prisma.conversacionChat.findFirst({
      where: { id, usuarioId },
    });

    if (!conversacion) {
      throw new NotFoundException('Conversación no encontrada');
    }

    await this.prisma.conversacionChat.delete({ where: { id } });
    return { ok: true };
  }

  private normalizarTemas(temas: string[]) {
    return Array.from(
      new Set(
        (temas || [])
          .map((tema) =>
            String(tema || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
              .replace(/\s+/g, ' ')
              .trim(),
          )
          .filter((tema) => tema.length >= 3)
          .slice(0, 10),
      ),
    );
  }
}
