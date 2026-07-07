import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenService } from '../services/token.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).accessToken;

  const isPublicAuth =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/institutions/register') ||
    req.url.includes('/emergency/contacts') ||
    req.url.includes('/contact') ||
    (req.url.includes('/specialties') && req.method === 'GET') ||
    (req.url.includes('/doctors') && req.method === 'GET');

  if (!token || isPublicAuth) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
