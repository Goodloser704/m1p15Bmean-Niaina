import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'currency' | 'status' | 'actions';
  mobileHide?: boolean;
  sortable?: boolean;
}

export interface TableAction {
  label: string;
  icon: string;
  action: string;
  class?: string;
}

@Component({
  standalone: true,
  selector: 'app-responsive-table',
  imports: [CommonModule],
  template: `
    <!-- Desktop Table -->
    <div class="desktop-table">
      <table class="table">
        <thead>
          <tr>
            <th *ngFor="let col of columns" [class.sortable]="col.sortable">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of data">
            <td *ngFor="let col of columns" [attr.data-label]="col.label">
              <ng-container [ngSwitch]="col.type">
                <!-- Text -->
                <span *ngSwitchCase="'text'">{{ getValue(item, col.key) }}</span>
                
                <!-- Date -->
                <span *ngSwitchCase="'date'" class="date-cell">
                  {{ getValue(item, col.key) | date:'dd/MM/yyyy HH:mm' }}
                </span>
                
                <!-- Currency -->
                <span *ngSwitchCase="'currency'" class="currency-cell">
                  {{ getValue(item, col.key) | currency:'EUR':'symbol':'1.2-2' }}
                </span>
                
                <!-- Status -->
                <span *ngSwitchCase="'status'" 
                      class="status-badge" 
                      [class]="'status-' + getValue(item, col.key)">
                  {{ getStatusLabel(getValue(item, col.key)) }}
                </span>
                
                <!-- Actions -->
                <div *ngSwitchCase="'actions'" class="actions-cell">
                  <button *ngFor="let action of getActions(item)" 
                          (click)="onAction(action.action, item)"
                          [class]="'btn btn-sm ' + (action.class || 'btn-primary')">
                    {{ action.icon }} {{ action.label }}
                  </button>
                </div>
                
                <!-- Default -->
                <span *ngSwitchDefault>{{ getValue(item, col.key) }}</span>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="mobile-cards">
      <div *ngFor="let item of data" class="mobile-card">
        <div *ngFor="let col of columns" class="mobile-field" [class.mobile-hide]="col.mobileHide">
          <div class="field-label">{{ col.label }}</div>
          <div class="field-value">
            <ng-container [ngSwitch]="col.type">
              <!-- Text -->
              <span *ngSwitchCase="'text'">{{ getValue(item, col.key) }}</span>
              
              <!-- Date -->
              <span *ngSwitchCase="'date'" class="date-cell">
                {{ getValue(item, col.key) | date:'dd/MM/yyyy HH:mm' }}
              </span>
              
              <!-- Currency -->
              <span *ngSwitchCase="'currency'" class="currency-cell">
                {{ getValue(item, col.key) | currency:'EUR':'symbol':'1.2-2' }}
              </span>
              
              <!-- Status -->
              <span *ngSwitchCase="'status'" 
                    class="status-badge" 
                    [class]="'status-' + getValue(item, col.key)">
                {{ getStatusLabel(getValue(item, col.key)) }}
              </span>
              
              <!-- Actions -->
              <div *ngSwitchCase="'actions'" class="mobile-actions">
                <button *ngFor="let action of getActions(item)" 
                        (click)="onAction(action.action, item)"
                        [class]="'btn btn-sm ' + (action.class || 'btn-primary')">
                  {{ action.icon }} {{ action.label }}
                </button>
              </div>
              
              <!-- Default -->
              <span *ngSwitchDefault>{{ getValue(item, col.key) }}</span>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="data.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-message">{{ emptyMessage || 'Aucune donnée disponible' }}</div>
    </div>
  `,
  styles: [`
    /* Desktop Table */
    .desktop-table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(44, 62, 80, 0.9);
      border-radius: 8px;
      overflow: hidden;
    }

    .table th {
      background: linear-gradient(135deg, #34495e, #2c3e50);
      color: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e67e22;
    }

    .table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .table th.sortable:hover {
      background: linear-gradient(135deg, #3d566e, #34495e);
    }

    .table td {
      padding: 12px;
      border-bottom: 1px solid #34495e;
      color: #ecf0f1;
    }

    .table tr:hover {
      background: rgba(52, 73, 94, 0.5);
    }

    /* Mobile Cards */
    .mobile-cards {
      display: none;
    }

    .mobile-card {
      background: rgba(44, 62, 80, 0.9);
      border: 2px solid #34495e;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .mobile-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(52, 73, 94, 0.5);
    }

    .mobile-field:last-child {
      border-bottom: none;
    }

    .mobile-field.mobile-hide {
      display: none;
    }

    .field-label {
      font-weight: 600;
      color: #bdc3c7;
      font-size: 0.9em;
      flex: 1;
    }

    .field-value {
      flex: 2;
      text-align: right;
      color: #ecf0f1;
    }

    /* Status Badges */
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-pending {
      background: rgba(243, 156, 18, 0.2);
      color: #f39c12;
      border: 1px solid #f39c12;
    }

    .status-approved,
    .status-confirmed,
    .status-paid {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
      border: 1px solid #27ae60;
    }

    .status-rejected,
    .status-canceled {
      background: rgba(231, 76, 60, 0.2);
      color: #e74c3c;
      border: 1px solid #e74c3c;
    }

    .status-in_progress {
      background: rgba(52, 152, 219, 0.2);
      color: #3498db;
      border: 1px solid #3498db;
    }

    /* Currency */
    .currency-cell {
      font-weight: 600;
      color: #27ae60;
    }

    /* Date */
    .date-cell {
      font-family: monospace;
      font-size: 0.9em;
    }

    /* Actions */
    .actions-cell,
    .mobile-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8em;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 0.75em;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
    }

    .btn-success {
      background: linear-gradient(135deg, #27ae60, #229954);
      color: white;
    }

    .btn-warning {
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
    }

    .btn-danger {
      background: linear-gradient(135deg, #e74c3c, #c0392b);
      color: white;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #bdc3c7;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-message {
      font-size: 1.1em;
      color: #95a5a6;
    }

    /* Mobile Responsive */
    @media (max-width: 767px) {
      .desktop-table {
        display: none;
      }

      .mobile-cards {
        display: block;
      }

      .mobile-actions {
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }

      .mobile-actions .btn {
        width: 100%;
        justify-content: center;
      }

      .field-value {
        text-align: left;
        margin-top: 4px;
      }

      .mobile-field {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ResponsiveTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage?: string;

  getValue(item: any, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], item);
  }

  getActions(item: any): TableAction[] {
    return this.actions;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'approved': 'Approuvé',
      'rejected': 'Rejeté',
      'confirmed': 'Confirmé',
      'in_progress': 'En cours',
      'done': 'Terminé',
      'canceled': 'Annulé',
      'paid': 'Payé',
      'draft': 'Brouillon',
      'estimated': 'Estimé',
      'validated': 'Validé'
    };
    return statusLabels[status] || status;
  }

  onAction(action: string, item: any): void {
    // Emit action event to parent component
    console.log('Action:', action, 'Item:', item);
  }
}