import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-distributor-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './distributor-report.component.html',
  styleUrls: ['./distributor-report.component.scss']
})
export class DistributorReportComponent implements OnInit {

  targetStore: string = '';
  isLoading: boolean = false;
  trendsData: any[] = [];
  summaryText: string = '';
  errorMessage: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Pre-llenar con el nombre de la empresa del usuario logueado
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.targetStore = user.name;
    }
  }

  generateReport() {
    if (!this.targetStore.trim()) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.trendsData = [];
    this.summaryText = '';

    this.apiService.getDistributorReport(this.targetStore).subscribe({
      next: (res: any) => {
        // El backend devuelve: { message, reportId, data: [trends], analysis: string }
        this.trendsData = res.data || [];
        this.summaryText = res.analysis || ''; // Texto generado por el backend (no IA, estadística pura)
        this.isLoading = false;

        if (this.trendsData.length === 0) {
          this.errorMessage = `No hay suficientes datos de búsqueda recientes asociados a "${this.targetStore}" para generar tendencias.`;
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Error al generar el reporte de tendencias.';
      }
    });
  }

  // Helper para definir el nivel de demanda visualmente
  getDemandLevel(score: number): string {
    if (score > 50) return 'Muy Alta';
    if (score > 20) return 'Alta';
    if (score > 5) return 'Media';
    return 'Baja';
  }

  getDemandClass(score: number): string {
    if (score > 50) return 'fire'; // Rojo intenso
    if (score > 20) return 'high'; // Naranja
    if (score > 5) return 'medium'; // Amarillo
    return 'low'; // Gris/Verde suave
  }
}
