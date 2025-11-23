import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
// IMPORTANTE: Animaciones para el Toast
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

  // Variables Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.targetStore = user.name;
    } else {
      // Fallback por si no hay nombre (raro en Enterprise)
      this.targetStore = 'Mi Empresa';
    }
  }

  generateReport() {
    if (!this.targetStore) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.trendsData = [];
    this.summaryText = '';

    this.apiService.getDistributorReport(this.targetStore).subscribe({
      next: (res: any) => {
        this.trendsData = res.data || [];
        this.summaryText = res.analysis || '';
        this.isLoading = false;

        if (this.trendsData.length === 0) {
          this.errorMessage = `No hay suficientes datos de búsqueda recientes para "${this.targetStore}".`;
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Error al generar el reporte.';
      }
    });
  }

  // --- ENVIAR CORREO ---
  sendReportEmail() {
    const user = this.authService.getCurrentUser();
    const email = user ? user.email : 'tu correo';
    this.showNotification(`Su reporte fue generado y enviado a ${email} con éxito`, 'success');
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 4000);
  }

  // Helpers visuales
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
