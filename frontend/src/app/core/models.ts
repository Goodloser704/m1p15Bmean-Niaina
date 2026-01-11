export type UserRole = 'client' | 'mechanic' | 'manager';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface Vehicle {
  _id: string;
  ownerId: string;
  make: string;
  model: string;
  plate: string;
  vin?: string;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'in_progress' | 'done' | 'canceled';

export interface Appointment {
  _id: string;
  clientId: string;
  vehicleId: string;
  scheduledAt?: string;
  status: AppointmentStatus;
  clientNote?: string;
  managerNote?: string;
  mechanicNote?: string;
  mechanicId?: string;
}

export type WorkOrderStatus = 'draft' | 'validated' | 'paid';

export interface WorkOrderTask {
  label: string;
  price: number;
}

export interface WorkOrder {
  _id: string;
  appointmentId: string;
  mechanicId?: string;
  status: WorkOrderStatus;
  tasks: WorkOrderTask[];
  total?: number;
}

