export type UserRole = 'client' | 'mechanic' | 'manager';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ContractType = 'monthly' | 'daily' | 'commission';

export interface BankDetails {
  iban?: string;
  bic?: string;
  bankName?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates: Coordinates;
  geocodedAt?: string;
  source?: 'manual' | 'api' | 'gps';
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  phone?: string;
  address?: string;
  location?: Location;
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

// Nouveaux modèles pour les outils et ressources
export interface RequiredResource {
  toolId: string;
  quantityNeeded: number;
  estimatedDuration?: number;
  notes?: string;
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
  requiredResources?: RequiredResource[];
  resourcesReserved?: boolean;
  total?: number;
  estimationNote?: string;
  clientApproved?: boolean;
  clientNote?: string;
  messages?: WorkOrderMessage[];
  createdAt?: string;
  updatedAt?: string;
}

// Modèles pour les factures et TVA
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

// Nouveaux modèles pour la géolocalisation
export interface DistanceResult {
  distance: number;
  travelTime: number;
  unit: string;
}

export interface NearbyClient {
  id: string;
  name: string;
  address: string;
  distance: number;
  travelTime: number;
  coordinates: Coordinates;
  isAssigned?: boolean;
}

export interface RoutePoint {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceFromPrevious?: number;
  travelTimeFromPrevious?: number;
}

export interface OptimizedRoute {
  optimizedRoute: RoutePoint[];
  totalDistance: number;
  totalTime: number;
  savings: {
    message: string;
  };
}

export interface Garage {
  _id: string;
  name: string;
  description?: string;
  phone: string;
  email: string;
  location: Location;
  siret: string;
  vatNumber?: string;
  serviceRadius: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Modèles pour la gestion des outils
export type ToolCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'out_of_order';
export type ReservationStatus = 'reserved' | 'in_use' | 'returned' | 'consumed';

export interface Tool {
  id: string;
  name: string;
  category: string;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  isConsumable: boolean;
  unitPrice: number;
  minStockAlert: number;
  supplier?: string;
  reference?: string;
  location?: string;
  condition: ToolCondition;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolReservation {
  id: string;
  workOrderId: string;
  mechanicId: string;
  toolId: string;
  quantityReserved: number;
  quantityUsed: number;
  status: ReservationStatus;
  reservedAt: string;
  startedAt?: string;
  returnedAt?: string;
  notes?: string;
  condition: ToolCondition;
  createdAt: string;
  updatedAt: string;
  // Données populées
  tool?: Tool;
  workOrder?: WorkOrder;
}

export interface ToolAvailability {
  toolId: string;
  toolName?: string;
  quantityNeeded: number;
  quantityAvailable: number;
  available: boolean;
  reason?: string;
}

