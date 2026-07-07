import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../shared/models/user.model';
import { AuthService } from '../services/auth.service';

export const roleGuard = (expectedRole: UserRole): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const currentRole = auth.getCurrentUser()?.role;

  if (currentRole === expectedRole) {
    return true;
  }

  if (currentRole) {
    return router.createUrlTree([auth.getDefaultRouteByRole()]);
  }

  return router.createUrlTree(['/registro']);
};
