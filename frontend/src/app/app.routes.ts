import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { LoginPageComponent } from './pages/login/login.page';
import { RegisterPageComponent } from './pages/register/register.page';
import { DashboardPageComponent } from './pages/dashboard/dashboard.page';
import { ClientVehiclesPageComponent } from './pages/client/client-vehicles.page';
import { ClientAppointmentsPageComponent } from './pages/client/client-appointments.page';
import { ClientWorkOrdersPageComponent } from './pages/client/client-workorders.page';
import { ClientInvoicesPageComponent } from './pages/client/client-invoices.page';
import { MechanicWorkOrdersEnhancedPageComponent } from './pages/mechanic/mechanic-workorders-enhanced.page';
import { MechanicEarningsPageComponent } from './pages/mechanic/mechanic-earnings.page';
import { MechanicNearbyClientsPageComponent } from './pages/mechanic/mechanic-nearby-clients.page';
import { MechanicToolsPageComponent } from './pages/mechanic/mechanic-tools.page';
import { MechanicWorkdaysPageComponent } from './pages/mechanic/mechanic-workdays.page';
import { ManagerAppointmentsPageComponent } from './pages/manager/manager-appointments.page';
import { ManagerWorkOrdersPageComponent } from './pages/manager/manager-workorders.page';
import { ManagerVehiclesPageComponent } from './pages/manager/manager-vehicles.page';
import { ManagerRegistrationsPageComponent } from './pages/manager/manager-registrations.page';
import { ManagerInvoicesPageComponent } from './pages/manager/manager-invoices.page';
import { ManagerVatSettingsPageComponent } from './pages/manager/manager-vat-settings.page';
import { ManagerNearbyClientsPageComponent } from './pages/manager/manager-nearby-clients.page';
import { ManagerToolsPageComponent } from './pages/manager/manager-tools.page';
import { ManagerWorkdaysPageComponent } from './pages/manager/manager-workdays.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
  {
    path: 'client',
    canActivate: [authGuard, roleGuard('client')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'vehicles' },
      { path: 'vehicles', component: ClientVehiclesPageComponent },
      { path: 'appointments', component: ClientAppointmentsPageComponent },
      { path: 'workorders', component: ClientWorkOrdersPageComponent },
      { path: 'invoices', component: ClientInvoicesPageComponent }
    ]
  },
  {
    path: 'mechanic',
    canActivate: [authGuard, roleGuard('mechanic')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'workorders' },
      { path: 'workorders', component: MechanicWorkOrdersEnhancedPageComponent },
      { path: 'tools', component: MechanicToolsPageComponent },
      { path: 'workdays', component: MechanicWorkdaysPageComponent },
      { path: 'earnings', component: MechanicEarningsPageComponent },
      { path: 'nearby-clients', component: MechanicNearbyClientsPageComponent }
    ]
  },
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard('manager')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'appointments' },
      { path: 'appointments', component: ManagerAppointmentsPageComponent },
      { path: 'workorders', component: ManagerWorkOrdersPageComponent },
      { path: 'vehicles', component: ManagerVehiclesPageComponent },
      { path: 'tools', component: ManagerToolsPageComponent },
      { path: 'workdays', component: ManagerWorkdaysPageComponent },
      { path: 'registrations', component: ManagerRegistrationsPageComponent },
      { path: 'invoices', component: ManagerInvoicesPageComponent },
      { path: 'vat-settings', component: ManagerVatSettingsPageComponent },
      { path: 'nearby-clients', component: ManagerNearbyClientsPageComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
