import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

type CorreoData = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
};

@Injectable()
export class CorreoAprendizajeAdaptativoService {
  private readonly logger = new Logger(CorreoAprendizajeAdaptativoService.name);

  async enviar(data: CorreoData) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(
        `Correo no enviado a ${data.to}: faltan SMTP_HOST, SMTP_USER o SMTP_PASS.`,
      );
      return { enviado: false, motivo: 'smtp_no_configurado' };
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: data.to,
      subject: data.subject,
      html: data.html,
      attachments: data.attachments,
    });

    return { enviado: true };
  }
}
