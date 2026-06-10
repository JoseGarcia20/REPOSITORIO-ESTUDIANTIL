import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type RespuestaHttp = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepcionesGlobal.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const contexto = host.switchToHttp();
    const response = contexto.getResponse<Response>();
    const request = contexto.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.construirPayload(exception, status, request, response);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const error = exception as Error;
      this.logger.error(
        `${request.method} ${request.originalUrl || request.url} ${status}`,
        error?.stack || String(exception),
      );
    }

    response.status(status).json(payload);
  }

  private construirPayload(
    exception: unknown,
    status: number,
    request: Request,
    response: Response,
  ) {
    const path = request.originalUrl || request.url;
    const retryAfter = response.getHeader('Retry-After');

    if (!(exception instanceof HttpException)) {
      return {
        statusCode: status,
        message: 'Ocurrió un error interno. Intenta nuevamente más tarde.',
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString(),
        path,
      };
    }

    const respuesta = exception.getResponse();
    const detalle =
      typeof respuesta === 'string'
        ? { message: respuesta }
        : (respuesta as RespuestaHttp);

    const message =
      status === HttpStatus.TOO_MANY_REQUESTS && retryAfter && !detalle.message
        ? `Has realizado demasiadas solicitudes. Podrás volver a intentarlo en ${retryAfter} segundos.`
        : detalle.message || exception.message;

    return {
      statusCode: status,
      message,
      error: detalle.error || this.nombreError(status),
      timestamp: new Date().toISOString(),
      path,
      ...(status === HttpStatus.TOO_MANY_REQUESTS && retryAfter
        ? { retryAfter: Number(retryAfter) }
        : {}),
    };
  }

  private nombreError(status: number) {
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return 'Demasiadas solicitudes';
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      return 'No autorizado';
    }

    if (status === HttpStatus.FORBIDDEN) {
      return 'Acceso denegado';
    }

    if (status === HttpStatus.BAD_REQUEST) {
      return 'Solicitud inválida';
    }

    return 'Error HTTP';
  }
}
