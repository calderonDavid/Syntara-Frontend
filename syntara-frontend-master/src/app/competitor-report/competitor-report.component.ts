import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';

interface Competitor {
  store: string;
  price: number;
  date: string;
  url: string;
}

interface ProductComparison {
  productName: string;
  displayProduct?: string;
  myStore: string;
  myPrice: number;
  myDate: string;
  competitors: Competitor[];
}

@Component({
  selector: 'app-competitor-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './competitor-report.component.html',
  styleUrls: ['./competitor-report.component.scss']
})
export class CompetitorReportComponent implements OnInit {

  targetStore: string = '';
  isLoading: boolean = false;
  reportData: ProductComparison[] = [];
  errorMessage: string | null = null;
  analysisText: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Pre-llenar con el nombre de la empresa (Usuario)
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.targetStore = user.name;
    }
  }

  generateReport() {
    if (!this.targetStore.trim()) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.reportData = [];

    this.apiService.getCompetitorReport(this.targetStore).subscribe({
      next: (res: any) => {
        // El backend devuelve: { message, reportId, data: [], analysis (opcional) }
        this.reportData = res.data || [];
        this.analysisText = res.analysis || '';
        this.isLoading = false;

        if (this.reportData.length === 0) {
          this.errorMessage = `No encontramos productos registrados en la base de datos para la tienda "${this.targetStore}".`;
        }
      },
      error: (err) => {
        console.error('Error generando reporte:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Ocurrió un error al generar el análisis. Verifica el nombre de la tienda.';
      }
    });
  }

  // Calcula la diferencia porcentual para mostrar colores
  getDifferencePercent(myPrice: number, otherPrice: number): number {
    if (!myPrice || !otherPrice) return 0;
    return ((otherPrice - myPrice) / myPrice) * 100;
  }
}
