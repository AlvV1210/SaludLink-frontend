import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(err: HttpErrorResponse, fallback = 'Ocurrió un error.'): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor.';
  }
  const body = err.error;
  if (body && typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  return fallback;
}
