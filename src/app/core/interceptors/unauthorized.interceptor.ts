import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthRequest =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/institutions/register');

      if (err.status === 401 && !isAuthRequest && auth.isAuthenticated()) {
        auth.logout();
        void router.navigate(['/registro'], {
          queryParams: { sessionExpired: '1' },
        });
      }

      return throwError(() => err);
    }),
  );
};
