import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Permite entrar a rutas públicas de autenticación solo si NO hay sesión.
 * Si el usuario ya está autenticado, lo dejamos en registro.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return router.createUrlTree(['/registro']);
  }

  return true;
};
