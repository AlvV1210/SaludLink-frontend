import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowAuthenticated = route.data?.['allowAuthenticated'] === true;

  if (auth.isLoggedIn() && !allowAuthenticated) {
    return router.createUrlTree([auth.getDefaultRouteByRole()]);
  }

  return true;
};
