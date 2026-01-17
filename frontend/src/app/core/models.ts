export type UserRole = 'client' | 'mechanic' | 'manager';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ContractType = 'monthly' | 'daily' | 'commission';

export interface BankDetails {
  iban?: string;
  bic?: string;
  bankName?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  address?: string;
  createdAt?: string;
  // Informations spécifiques aux mécaniciens
  contractType?: ContractType;
  baseSalary?: number;
  commissionRate?: number;
  bankDetails?: BankDetails;
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

export type WorkOrderStatus = 'draft' | 'estimated' | 'pending_client_approval' | 'approved' | 'rejected' | 'validated' | 'paid';

export interface WorkOrderTask {
  label: string;
  price: number;
}

export interface WorkOrderMessage {
  _id: string;
  sender: 'client' | 'manager' | 'mechanic';
  message: string;
  createdAt: string;
}

export interface WorkOrder {
  _id: string;
  appointmentId: string;
  mechanicId?: string;
  status: WorkOrderStatus;
  tasks: WorkOrderTask[];
  total?: number;
  estimationNote?: string;
  clientApproved?: boolean;
  clientNote?: string;
  messages?: WorkOrderMessage[];
  createdAt?: string;
  updatedAt?: string;
}

// Nouveaux modèles pour les factures et TVA
export interface VatRule {
  keywords: string[];
  vatRate: number;
  description: string;
}

export interface VatSettings {
  _id?: string;
  defaultVatRate: number;
  rules: VatRule[];
  garageName: string;
  garageAddress: string;
  garageSiret: string;
}

export interface InvoiceItem {
  label: string;
  priceHT: number;
  vatRate: number;
  vatAmount: number;
  priceTTC: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  workOrderId: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  vehicleInfo: string;
  items: InvoiceItem[];
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  garageName: string;
  garageAddress: string;
  garageSiret: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

