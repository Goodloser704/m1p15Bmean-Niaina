import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.user && auth.token) await auth.init();
  if (auth.user) return true;

  await router.navigate(['/login']);
  return false;
};

