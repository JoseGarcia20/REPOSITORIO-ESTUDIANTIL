import { BadRequestException, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { extname, resolve, sep } from 'path';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import ExcelJS from 'exceljs';

type RecursoConArchivo = {
  rutaRecurso?: string | null;
  urlRecurso?: string | null;
};

export type TextoExtraidoRecurso = {
  texto: string;
  extension: string;
  caracteres: number;
};

@Injectable()
export class ExtractorTextoRecursoService {
  private readonly extensionesSoportadas = new Set([
    'pdf',
    'docx',
    'xlsx',
    'csv',
  ]);

  async extraer(recurso: RecursoConArchivo): Promise<TextoExtraidoRecurso> {
    const rutaLocal = this.resolverRutaLocal(recurso);
    const extension = this.obtenerExtension(rutaLocal);

    if (extension === 'doc') {
      throw new BadRequestException(
        'Los archivos .doc antiguos no se pueden resumir todavía. Convierte el documento a .docx.',
      );
    }

    if (extension === 'xls') {
      throw new BadRequestException(
        'Los archivos .xls antiguos no se pueden resumir todavía. Convierte la hoja de cálculo a .xlsx.',
      );
    }

    if (!this.extensionesSoportadas.has(extension)) {
      throw new BadRequestException(
        'El resumen AI está disponible para PDF, Word DOCX, Excel XLSX y CSV.',
      );
    }

    const buffer = await readFile(rutaLocal);
    const texto = await this.extraerTextoPorExtension(buffer, extension);
    const limpio = this.limpiarTexto(texto);

    if (limpio.length < 80) {
      throw new BadRequestException(
        'No se pudo extraer texto suficiente del archivo. Si es un PDF escaneado, primero necesita OCR.',
      );
    }

    return {
      texto: limpio,
      extension,
      caracteres: limpio.length,
    };
  }

  private resolverRutaLocal(recurso: RecursoConArchivo) {
    if (!recurso.rutaRecurso) {
      throw new BadRequestException(
        'Solo se pueden resumir archivos cargados en la plataforma.',
      );
    }

    if (!recurso.rutaRecurso.startsWith('/uploads/')) {
      throw new BadRequestException(
        'La ruta del recurso no pertenece al almacenamiento local permitido.',
      );
    }

    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const relativa = recurso.rutaRecurso.replace(/^\/uploads\/?/, '');
    const rutaLocal = resolve(uploadsRoot, relativa);

    if (!rutaLocal.startsWith(`${uploadsRoot}${sep}`)) {
      throw new BadRequestException('La ruta del recurso no es válida.');
    }

    return rutaLocal;
  }

  private obtenerExtension(ruta: string) {
    return extname(ruta).replace('.', '').toLowerCase();
  }

  private async extraerTextoPorExtension(buffer: Buffer, extension: string) {
    if (extension === 'pdf') {
      const resultado = await pdfParse(buffer);
      return resultado.text || '';
    }

    if (extension === 'docx') {
      const resultado = await mammoth.extractRawText({ buffer });
      return resultado.value || '';
    }

    if (extension === 'xlsx') {
      return this.extraerTextoExcel(buffer);
    }

    if (extension === 'csv') {
      return buffer.toString('utf8');
    }

    return '';
  }

  private async extraerTextoExcel(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    return workbook.worksheets
      .slice(0, 10)
      .map((hoja) => {
        const filas: string[] = [];

        hoja.eachRow({ includeEmpty: false }, (fila) => {
          const valores = Array.isArray(fila.values)
            ? fila.values.slice(1)
            : Object.values(fila.values || {});
          const contenido = valores
            .map((valor) => this.valorCeldaTexto(valor))
            .filter(Boolean)
            .join(', ');

          if (contenido) {
            filas.push(contenido);
          }
        });

        return `Hoja ${hoja.name}\n${filas.join('\n')}`;
      })
      .join('\n\n');
  }

  private valorCeldaTexto(valor: unknown): string {
    if (valor === null || valor === undefined) {
      return '';
    }

    if (valor instanceof Date) {
      return valor.toISOString().slice(0, 10);
    }

    if (typeof valor !== 'object') {
      return String(valor).trim();
    }

    const objeto = valor as Record<string, unknown>;

    if (typeof objeto.text === 'string') {
      return objeto.text.trim();
    }

    if (objeto.result !== undefined) {
      return this.valorCeldaTexto(objeto.result);
    }

    if (Array.isArray(objeto.richText)) {
      return objeto.richText
        .map((parte) =>
          typeof parte === 'object' && parte !== null && 'text' in parte
            ? String((parte as { text?: unknown }).text || '')
            : '',
        )
        .join('')
        .trim();
    }

    return '';
  }

  private limpiarTexto(texto: string) {
    return texto
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
