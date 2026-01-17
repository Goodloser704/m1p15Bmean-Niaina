import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicesService } from '../../core/services/invoices.service';
import { WorkOrdersService } from '../../core/services/workorders.service';
import type { Invoice, WorkOrder } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-client-invoices-page',
  imports: [CommonModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>📄 Mes Factures</h2>

        <!-- Générer factures pour work orders payés -->
        <div class="card" *ngIf="paidWorkOrdersWithoutInvoice().length > 0">
          <h3>💰 Réparations payées sans facture</h3>
          <p class="info">
            Vous pouvez générer les factures pour vos réparations payées.
          </p>
          
          <div class="workorders-list">
            <div *ngFor="let wo of paidWorkOrdersWithoutInvoice()" class="workorder-item">
              <div class="workorder-info">
                <h4>Réparation du {{ wo.updatedAt | date:'shortDate' }}</h4>
                <p>{{ wo.tasks.length }} tâche(s) - Total: {{ wo.total }}€</p>
                <ul class="tasks-list">
                  <li *ngFor="let task of wo.tasks">{{ task.label }} - {{ task.price }}€</li>
                </ul>
              </div>
              <button 
                (click)="generateInvoice(wo._id)" 
                [disabled]="generating()"
                class="generate-btn">
                📄 Générer facture
              </button>
            </div>
          </div>
        </div>

        <!-- Liste des factures -->
        <div class="card">
          <h3>📋 Historique des factures</h3>
          
          <div *ngIf="invoices().length > 0" class="invoices-list">
            <div *ngFor="let invoice of invoices()" class="invoice-item">
              <div class="invoice-header">
                <div class="invoice-number">
                  <strong>Facture {{ invoice.invoiceNumber }}</strong>
                  <span class="status" [class]="'status-' + invoice.status">
                    {{ getStatusLabel(invoice.status) }}
                  </span>
                </div>
                <div class="invoice-date">
                  {{ invoice.invoiceDate | date:'shortDate' }}
                </div>
              </div>
              
              <div class="invoice-details">
                <div class="vehicle-info">
                  <strong>Véhicule:</strong> {{ invoice.vehicleInfo }}
                </div>
                
                <div class="amounts">
                  <div class="amount-row">
                    <span>Total HT:</span>
                    <span>{{ invoice.totalHT }}€</span>
                  </div>
                  <div class="amount-row">
                    <span>TVA:</span>
                    <span>{{ invoice.totalVAT }}€</span>
                  </div>
                  <div class="amount-row total">
                    <span><strong>Total TTC:</strong></span>
                    <span><strong>{{ invoice.totalTTC }}€</strong></span>
                  </div>
                </div>
              </div>
              
              <div class="invoice-actions">
                <button (click)="viewInvoice(invoice)" class="view-btn">
                  👁️ Voir détail
                </button>
                <button (click)="downloadInvoice(invoice)" class="download-btn">
                  📥 Télécharger
                </button>
              </div>
            </div>
          </div>
          
          <p *ngIf="invoices().length === 0" class="info">
            Aucune facture générée pour le moment.
          </p>
        </div>

        <!-- Modal détail facture -->
        <div class="modal" *ngIf="selectedInvoice()" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="invoice-detail">
              <div class="invoice-header-detail">
                <div class="garage-info">
                  <h3>{{ selectedInvoice()!.garageName }}</h3>
                  <p>{{ selectedInvoice()!.garageAddress }}</p>
                  <p>SIRET: {{ selectedInvoice()!.garageSiret }}</p>
                </div>
                <div class="invoice-info">
                  <h3>FACTURE {{ selectedInvoice()!.invoiceNumber }}</h3>
                  <p>Date: {{ selectedInvoice()!.invoiceDate | date:'shortDate' }}</p>
                </div>
              </div>
              
              <div class="client-info">
                <h4>Facturé à:</h4>
                <p><strong>{{ selectedInvoice()!.clientName }}</strong></p>
                <p *ngIf="selectedInvoice()!.clientAddress">{{ selectedInvoice()!.clientAddress }}</p>
              </div>
              
              <div class="vehicle-section">
                <h4>Véhicule:</h4>
                <p>{{ selectedInvoice()!.vehicleInfo }}</p>
              </div>
              
              <div class="items-section">
                <h4>Détail des prestations:</h4>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Prix HT</th>
                      <th>TVA</th>
                      <th>Prix TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of selectedInvoice()!.items">
                      <td>{{ item.label }}</td>
                      <td>{{ item.priceHT }}€</td>
                      <td>{{ item.vatRate }}% ({{ item.vatAmount }}€)</td>
                      <td><strong>{{ item.priceTTC }}€</strong></td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>TOTAL</strong></td>
                      <td><strong>{{ selectedInvoice()!.totalHT }}€</strong></td>
                      <td><strong>{{ selectedInvoice()!.totalVAT }}€</strong></td>
                      <td><strong>{{ selectedInvoice()!.totalTTC }}€</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <button (click)="closeModal()" class="close-btn">Fermer</button>
          </div>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .workorders-list {
      margin-top: 16px;
    }

    .workorder-item {
      background: rgba(52, 73, 94, 0.6);
      border: 2px solid #34495e;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .workorder-info h4 {
      color: #ffffff;
      margin: 0 0 8px 0;
    }

    .workorder-info p {
      color: #bdc3c7;
      margin: 4px 0;
    }

    .tasks-list {
      margin: 8px 0 0 16px;
      color: #ecf0f1;
    }

    .tasks-list li {
      margin: 2px 0;
      font-size: 14px;
    }

    .generate-btn {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      border: 2px solid #e67e22;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      white-space: nowrap;
    }

    .invoices-list {
      margin-top: 16px;
    }

    .invoice-item {
      background: rgba(52, 73, 94, 0.6);
      border: 2px solid #34495e;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .invoice-number {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .invoice-number strong {
      color: #ffffff;
      font-size: 18px;
    }

    .status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-sent {
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
    }

    .status-paid {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
    }

    .invoice-date {
      color: #bdc3c7;
      font-weight: 600;
    }

    .invoice-details {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      margin-bottom: 16px;
    }

    .vehicle-info {
      color: #f8f9fa;
    }

    .amounts {
      text-align: right;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin: 4px 0;
      color: #f8f9fa;
    }

    .amount-row.total {
      border-top: 2px solid #e67e22;
      padding-top: 8px;
      margin-top: 8px;
      font-size: 18px;
      color: #ffffff;
    }

    .invoice-actions {
      display: flex;
      gap: 12px;
    }

    .view-btn {
      background: linear-gradient(135deg, #3498db, #2980b9);
      border: 2px solid #3498db;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .download-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      border: 2px solid #27ae60;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }

    .modal-content {
      background: linear-gradient(135deg, #2c3e50, #34495e);
      padding: 30px;
      border-radius: 16px;
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 2px solid #e67e22;
      color: #f8f9fa;
    }

    .invoice-header-detail {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 30px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #34495e;
    }

    .garage-info h3,
    .invoice-info h3 {
      color: #ffffff;
      margin: 0 0 8px 0;
    }

    .client-info,
    .vehicle-section,
    .items-section {
      margin: 20px 0;
    }

    .client-info h4,
    .vehicle-section h4,
    .items-section h4 {
      color: #e67e22;
      margin: 0 0 12px 0;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    .items-table th,
    .items-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #34495e;
    }

    .items-table th {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
    }

    .items-table tfoot td {
      background: rgba(230, 126, 34, 0.2);
      font-weight: 600;
      border-top: 2px solid #e67e22;
    }

    .close-btn {
      background: linear-gradient(135deg, #7f8c8d, #95a5a6);
      border: 2px solid #7f8c8d;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 20px;
    }

    .info {
      background: rgba(52, 152, 219, 0.2);
      border-left: 4px solid #3498db;
      padding: 12px;
      border-radius: 8px;
      color: #f8f9fa;
      margin: 16px 0;
    }
  `]
})
export class ClientInvoicesPageComponent {
  invoices = signal<Invoice[]>([]);
  workOrders = signal<WorkOrder[]>([]);
  selectedInvoice = signal<Invoice | null>(null);
  generating = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(
    private invoicesService: InvoicesService,
    private workOrdersService: WorkOrdersService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const [invoices, workOrders] = await Promise.all([
        this.invoicesService.list(),
        this.workOrdersService.list()
      ]);
      
      this.invoices.set(invoices);
      this.workOrders.set(workOrders);
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des données');
    }
  }

  paidWorkOrdersWithoutInvoice() {
    const paidWorkOrders = this.workOrders().filter(wo => wo.status === 'paid');
    const invoicedWorkOrderIds = new Set(this.invoices().map(inv => inv.workOrderId));
    
    return paidWorkOrders.filter(wo => !invoicedWorkOrderIds.has(wo._id));
  }

  async generateInvoice(workOrderId: string): Promise<void> {
    this.generating.set(true);
    this.error.set(null);

    try {
      const invoice = await this.invoicesService.generateFromWorkOrder(workOrderId);
      this.success.set(`Facture ${invoice.invoiceNumber} générée avec succès !`);
      await this.loadData();
    } catch (error: any) {
      this.error.set('Erreur lors de la génération de la facture');
    } finally {
      this.generating.set(false);
    }
  }

  getStatusLabel(status: string): string {
    const labels = {
      'draft': 'Brouillon',
      'sent': 'Envoyée',
      'paid': 'Payée'
    };
    return labels[status as keyof typeof labels] || status;
  }

  viewInvoice(invoice: Invoice): void {
    this.selectedInvoice.set(invoice);
  }

  closeModal(): void {
    this.selectedInvoice.set(null);
  }

  downloadInvoice(invoice: Invoice): void {
    // TODO: Implémenter le téléchargement PDF
    this.success.set('Téléchargement PDF à implémenter');
  }
}