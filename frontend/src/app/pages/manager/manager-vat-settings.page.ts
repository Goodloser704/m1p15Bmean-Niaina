import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VatService } from '../../core/services/vat.service';
import type { VatSettings, VatRule } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-manager-vat-settings-page',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-mechanic-theme">
      <div class="wrap">
        <h2>⚙️ Paramètres TVA</h2>

        <!-- Informations garage -->
        <div class="card">
          <h3>🏢 Informations Garage</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Nom du garage</label>
              <input 
                type="text" 
                [(ngModel)]="settings().garageName"
                placeholder="Garage Auto Plus">
            </div>
            <div class="form-group">
              <label>Adresse</label>
              <textarea 
                [(ngModel)]="settings().garageAddress"
                placeholder="123 Rue de la Mécanique, 75001 Paris"
                rows="2">
              </textarea>
            </div>
            <div class="form-group">
              <label>SIRET</label>
              <input 
                type="text" 
                [(ngModel)]="settings().garageSiret"
                placeholder="12345678901234">
            </div>
          </div>
        </div>

        <!-- Paramètres TVA -->
        <div class="card">
          <h3>💰 Taux de TVA</h3>
          
          <div class="form-group">
            <label>Taux par défaut (%)</label>
            <input 
              type="number" 
              [(ngModel)]="settings().defaultVatRate"
              min="0" 
              max="100" 
              step="0.1">
          </div>

          <h4>📋 Règles automatiques</h4>
          <p class="info">
            Le système détecte automatiquement le taux de TVA selon les mots-clés dans les tâches.
          </p>

          <div class="rules-list">
            <div *ngFor="let rule of settings().rules; let i = index" class="rule-item">
              <div class="rule-header">
                <h5>{{ rule.description }}</h5>
                <button (click)="removeRule(i)" class="delete-btn">🗑️</button>
              </div>
              
              <div class="rule-content">
                <div class="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    [(ngModel)]="rule.description"
                    placeholder="Services et main d'œuvre">
                </div>
                
                <div class="form-group">
                  <label>Taux TVA (%)</label>
                  <input 
                    type="number" 
                    [(ngModel)]="rule.vatRate"
                    min="0" 
                    max="100" 
                    step="0.1">
                </div>
                
                <div class="form-group">
                  <label>Mots-clés (séparés par des virgules)</label>
                  <textarea 
                    [value]="rule.keywords.join(', ')"
                    (input)="updateKeywords(i, $event)"
                    placeholder="vidange, huile, filtre, revision"
                    rows="2">
                  </textarea>
                  <small>Le système cherche ces mots dans les tâches (insensible à la casse)</small>
                </div>
              </div>
            </div>
          </div>

          <button (click)="addRule()" class="add-btn">
            ➕ Ajouter une règle
          </button>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button (click)="save()" [disabled]="saving()" class="save-btn">
            {{ saving() ? 'Sauvegarde...' : '💾 Sauvegarder' }}
          </button>
          <button (click)="reset()" [disabled]="saving()" class="reset-btn">
            🔄 Réinitialiser
          </button>
        </div>

        <p class="error" *ngIf="error()">{{ error() }}</p>
        <p class="success" *ngIf="success()">{{ success() }}</p>
      </div>
    </div>
  `,
  styles: [`
    .form-grid {
      display: grid;
      gap: 20px;
      margin-top: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      color: #f8f9fa;
      font-weight: 600;
      font-size: 14px;
    }

    .form-group input,
    .form-group textarea {
      padding: 12px;
      border: 2px solid #34495e;
      border-radius: 8px;
      background: rgba(44, 62, 80, 0.9);
      color: #ffffff;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      border-color: #e67e22;
      background: rgba(44, 62, 80, 1);
      box-shadow: 0 0 10px rgba(230, 126, 34, 0.3);
      outline: none;
    }

    .form-group small {
      color: #bdc3c7;
      font-size: 12px;
    }

    .rules-list {
      margin: 20px 0;
    }

    .rule-item {
      background: rgba(52, 73, 94, 0.6);
      border: 2px solid #34495e;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .rule-header {
      background: linear-gradient(135deg, #e67e22, #f39c12);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .rule-header h5 {
      margin: 0;
      color: white;
      font-weight: 600;
    }

    .rule-content {
      padding: 16px;
      display: grid;
      gap: 16px;
    }

    .delete-btn {
      background: rgba(231, 76, 60, 0.8);
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .delete-btn:hover {
      background: rgba(231, 76, 60, 1);
    }

    .add-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      border: 2px solid #27ae60;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
    }

    .add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(39, 174, 96, 0.4);
    }

    .actions {
      display: flex;
      gap: 16px;
      margin-top: 30px;
    }

    .save-btn {
      background: linear-gradient(135deg, #3498db, #2980b9);
      border: 2px solid #3498db;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
    }

    .reset-btn {
      background: linear-gradient(135deg, #95a5a6, #7f8c8d);
      border: 2px solid #95a5a6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 16px;
    }

    .save-btn:disabled,
    .reset-btn:disabled {
      background: #7f8c8d;
      border-color: #95a5a6;
      cursor: not-allowed;
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
export class ManagerVatSettingsPageComponent {
  settings = signal<VatSettings>({
    defaultVatRate: 20,
    rules: [],
    garageName: '',
    garageAddress: '',
    garageSiret: ''
  });
  
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(private vatService: VatService) {}

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const settings = await this.vatService.getSettings();
      this.settings.set(settings);
    } catch (error: any) {
      this.error.set('Erreur lors du chargement des paramètres');
    }
  }

  addRule(): void {
    const currentSettings = this.settings();
    const newRule: VatRule = {
      keywords: [],
      vatRate: 20,
      description: 'Nouvelle règle'
    };
    
    this.settings.set({
      ...currentSettings,
      rules: [...currentSettings.rules, newRule]
    });
  }

  removeRule(index: number): void {
    const currentSettings = this.settings();
    const newRules = currentSettings.rules.filter((_, i) => i !== index);
    
    this.settings.set({
      ...currentSettings,
      rules: newRules
    });
  }

  updateKeywords(index: number, event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const keywords = target.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    const currentSettings = this.settings();
    const newRules = [...currentSettings.rules];
    newRules[index] = { ...newRules[index], keywords };
    
    this.settings.set({
      ...currentSettings,
      rules: newRules
    });
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const updatedSettings = await this.vatService.updateSettings(this.settings());
      this.settings.set(updatedSettings);
      this.success.set('Paramètres sauvegardés avec succès !');
    } catch (error: any) {
      this.error.set('Erreur lors de la sauvegarde');
    } finally {
      this.saving.set(false);
    }
  }

  async reset(): Promise<void> {
    await this.loadSettings();
    this.success.set('Paramètres réinitialisés');
  }
}