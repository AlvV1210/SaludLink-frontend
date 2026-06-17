import { HttpInterceptorFn } from '@angular/common/http';

import { AUTH_TOKEN_KEY } from '../constants/storage-keys';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  const isAuthRequest =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register');

  if (!token || isAuthRequest) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};