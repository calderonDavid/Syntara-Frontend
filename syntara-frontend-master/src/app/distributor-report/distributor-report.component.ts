import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-distributor-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './distributor-report.component.html',
  styleUrls: ['./distributor-report.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, 20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translate(-50%, 0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translate(-50%, 20px)' }))
      ])
    ])
  ]
})
export class DistributorReportComponent implements OnInit {

  targetStore: string = '';
  isLoading: boolean = false;
  trendsData: any[] = [];
  summaryText: string = '';
  errorMessage: string | null = null;

  // Modal Config
  showReportModal: boolean = false;

  // --- VARIABLES DE FECHA ---
  minDate: string = '';
  maxDate: string = '';

  reportConfig = {
    selectedProducts: {} as any,
    dateStart: '',
    dateEnd: '',
    format: 'xlsx',
    ccEmail: ''
  };

  availableProducts: string[] = [];

  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.targetStore = user.name;
    } else {
      this.targetStore = 'Mi Empresa';
    }
    this.setupDateLimits(); // Inicializar fechas
  }

  setupDateLimits() {
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    this.minDate = '2025-11-01';
  }

  generateReport() {
    if (!this.targetStore) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.trendsData = [];
    this.summaryText = '';
    this.availableProducts = [];
    this.reportConfig.selectedProducts = {};

    this.apiService.getDistributorReport(this.targetStore).subscribe({
      next: (res: any) => {
        const rawData = res.data || [];
        this.summaryText = res.analysis || '';

        // Filtro precio > 0
        this.trendsData = rawData.filter((item: any) => {
          const price = item.priceStats?.avg || 0;
          return price > 0;
        });

        this.isLoading = false;

        if (this.trendsData.length === 0) {
          if (rawData.length > 0) {
            this.errorMessage = `Se encontraron productos, pero ninguno tiene un precio válido mayor a 0.`;
          } else {
            this.errorMessage = `No hay suficientes datos de búsqueda recientes para "${this.targetStore}".`;
          }
        } else {
          // Normalización
          const productMap = new Map<string, string>();

          this.trendsData.forEach(item => {
            const rawName = item.product;
            const cleanName = this.normalizeProductName(rawName);

            if (cleanName && !productMap.has(cleanName)) {
              let displayName = rawName.trim();
              displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
              productMap.set(cleanName, displayName);
            }
          });

          this.availableProducts = Array.from(productMap.values());

          this.availableProducts.forEach(prod => {
            this.reportConfig.selectedProducts[prod] = false;
          });
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Error al generar el reporte.';
      }
    });
  }

  normalizeProductName(name: string): string {
    if (!name) return '';
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  openReportModal() {
    if (this.availableProducts.length === 0) {
      this.showNotification('Primero debes analizar tendencias y obtener resultados válidos.', 'warning');
      return;
    }
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  confirmGeneration() {
    const hasProdSelected = Object.values(this.reportConfig.selectedProducts).some(val => val);

    if (!hasProdSelected) {
      this.showNotification('Selecciona al menos un producto para el reporte.', 'warning');
      return;
    }
    if (!this.reportConfig.dateStart || !this.reportConfig.dateEnd) {
      this.showNotification('Por favor define el rango de fechas.', 'warning');
      return;
    }

    // Validaciones extra
    if (this.reportConfig.dateStart > this.reportConfig.dateEnd) {
      this.showNotification('Fecha de inicio mayor a fecha final.', 'warning');
      return;
    }
    if (this.reportConfig.dateEnd > this.maxDate) {
      this.showNotification('No puedes seleccionar una fecha futura.', 'warning');
      return;
    }

    this.showReportModal = false;
    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.showNotification(
        'Su reporte fue generado exitosamente, será enviado en un plazo de 3 días hábiles a los correos anexos',
        'success'
      );
    }, 1500);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 5000);
  }

  getDemandLevel(score: number): string {
    if (score > 50) return 'Muy Alta';
    if (score > 20) return 'Alta';
    if (score > 5) return 'Media';
    return 'Baja';
  }

  getDemandClass(score: number): string {
    if (score > 50) return 'fire';
    if (score > 20) return 'high';
    if (score > 5) return 'medium';
    return 'low';
  }
}
