import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import type { UserRole } from '../models';

export function roleGuard(roles: UserRole | UserRole[]): CanActivateFn {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.user && auth.token) await auth.init();
    if (auth.user && allowed.includes(auth.user.role)) return true;

    await router.navigate(['/dashboard']);
    return false;
  };
}

