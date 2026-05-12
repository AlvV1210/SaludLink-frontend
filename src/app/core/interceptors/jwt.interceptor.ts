import { HttpInterceptorFn } from '@angular/common/http';
import { AUTH_TOKEN_KEY } from '../constants/storage-keys';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
