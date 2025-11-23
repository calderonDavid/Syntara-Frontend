import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-competitor-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './competitor-report.component.html',
  styleUrls: ['./competitor-report.component.scss'],
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
export class CompetitorReportComponent implements OnInit, AfterViewInit {

  @ViewChild('priceChart') priceChartRef!: ElementRef;
  chartInstance: any = null;

  targetProduct: string = '';
  myStoreName: string = '';
  isLoading: boolean = false;
  reportData: any = null;
  competitors: any[] = [];
  errorMessage: string | null = null;

  // Configuración de Modal
  showReportModal: boolean = false;
  isLoadingCompetitors: boolean = false;

  // Variables de Fecha
  minDate: string = '';
  maxDate: string = '';

  reportConfig = {
    selectedCompetitors: {} as any,
    dateStart: '',
    dateEnd: '',
    format: 'pdf',
    ccEmail: ''
  };

  availableCompetitors: string[] = [];

  // Variables Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.myStoreName = user.name;
    }
    this.setupDateLimits();
  }

  ngAfterViewInit() {}

  setupDateLimits() {
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
    this.minDate = '2024-11-01';
  }

  preventInvalidCharacters(event: KeyboardEvent): void {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }

  generatePreview() {
    if (!this.targetProduct.trim()) {
      this.showNotification('Escribe un producto para analizar.', 'warning');
      return;
    }
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.reportData = null;
    this.competitors = [];
    this.availableCompetitors = [];
    this.reportConfig.selectedCompetitors = {};

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    this.apiService.getCompetitorReport(this.targetProduct).subscribe({
      next: (res: any) => {
        const rawPrices = res.data || [];
        this.processData(rawPrices);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.errorMessage = 'No pudimos generar el análisis.';
      }
    });
  }

  processData(prices: any[]) {
    if (!prices || prices.length === 0) {
      this.errorMessage = 'No se encontraron registros para este producto.';
      return;
    }

    const validPrices = prices.filter(p => p.price > 0);

    if (validPrices.length === 0) {
      this.errorMessage = 'Se encontraron productos, pero ninguno tiene un precio válido.';
      return;
    }

    const myRecord = validPrices.find(p => p.store.toLowerCase().includes(this.myStoreName.toLowerCase()));
    const others = validPrices.filter(p => !p.store.toLowerCase().includes(this.myStoreName.toLowerCase()));

    this.reportData = {
      productName: this.targetProduct,
      myPrice: myRecord ? myRecord.price : null,
      myDate: myRecord ? myRecord.date : null,
      myUrl: myRecord ? myRecord.url : null
    };
    this.competitors = others;

    // Agrupar para el checklist usando normalización estricta
    const storeMap = new Map<string, string>();
    others.forEach(c => {
      const cleanName = this.normalizeStoreName(c.store);
      if (!storeMap.has(cleanName)) {
        const displayName = this.formatStoreName(c.store);
        storeMap.set(cleanName, displayName);
      }
    });
    this.availableCompetitors = Array.from(storeMap.values());
    this.availableCompetitors.forEach(store => {
      this.reportConfig.selectedCompetitors[store] = false;
    });

    setTimeout(() => {
      this.renderChart(validPrices);
    }, 100);
  }

  // --- NORMALIZACIÓN ESTRICTA ---
  normalizeStoreName(name: string): string {
    if (!name) return '';
    let clean = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/(\.com\.co|\.com|\.co)/g, '') // Quitar dominios
      .replace(/[^a-z0-9\s]/g, ' ') // Quitar caracteres especiales (parentesis, guiones)
      .trim();

    // Agrupación específica para casos conocidos
    if (clean.includes('mercado libre') || clean.includes('mercadolibre')) return 'mercadolibre';
    if (clean.includes('exito')) return 'exito';
    if (clean.includes('carulla')) return 'carulla';
    if (clean.includes('olimpica')) return 'olimpica';
    if (clean.includes('jumbo')) return 'jumbo';
    if (clean.includes('alkosto')) return 'alkosto';
    if (clean.includes('falabella')) return 'falabella';
    if (clean.includes('rappi')) return 'rappi';

    return clean;
  }

  // Formatear nombre bonito para mostrar
  formatStoreName(rawName: string): string {
    const clean = this.normalizeStoreName(rawName);
    const prettyNames: {[key: string]: string} = {
      'mercadolibre': 'Mercado Libre',
      'exito': 'Éxito',
      'carulla': 'Carulla',
      'olimpica': 'Olímpica',
      'jumbo': 'Jumbo',
      'alkosto': 'Alkosto',
      'falabella': 'Falabella',
      'rappi': 'Rappi'
    };

    if (prettyNames[clean]) return prettyNames[clean];

    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  renderChart(data: any[]) {
    if (!this.priceChartRef) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.priceChartRef.nativeElement.getContext('2d');

    // Agrupación por tienda usando tu normalización
    const groupedData: { [store: string]: { [date: string]: number[] } } = {};

    data.forEach(item => {
      const storeLabel = this.formatStoreName(item.store);
      const dateStr = item.date; // Mantener fecha tal cual

      if (!groupedData[storeLabel]) {
        groupedData[storeLabel] = {};
      }
      if (!groupedData[storeLabel][dateStr]) {
        groupedData[storeLabel][dateStr] = [];
      }
      groupedData[storeLabel][dateStr].push(item.price);
    });

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

    const datasets = Object.keys(groupedData).map((store, index) => {
      const points = Object.keys(groupedData[store]).map(date => {
        const prices = groupedData[store][date];
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        return {
          x: date,  // Chart.js lo interpretará automáticamente como fecha con el adaptador
          y: Math.round(avgPrice)
        };
      });

      points.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

      const color = colors[index % colors.length];

      return {
        label: store,
        data: points,

        // Línea
        borderColor: color,
        backgroundColor: color,
        tension: 0,
        borderWidth: 2,
        fill: false,
        showLine: true,

        // --- PUNTOS ---
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: color,
        pointBorderWidth: 2,
        hitRadius: 20,
        hoverBorderWidth: 3
      };
    });

    // Definir los límites Y dinámicamente
    const allAvgPrices = datasets.flatMap(d => d.data.map(p => p.y));
    const minPrice = Math.min(...allAvgPrices);
    const maxPrice = Math.max(...allAvgPrices);
    const yMin = Math.floor(minPrice * 0.90);
    const yMax = Math.ceil(maxPrice * 1.10);

    // Configuración final Chart.js
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: 'Evolución de Precios Promedio',
            font: { size: 16, family: "'Rubik', sans-serif" },
            color: '#004b3a',
            padding: { bottom: 20 }
          },
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, padding: 20 }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1e293b',
            bodyColor: '#334155',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            usePointStyle: true,
            callbacks: {
              title: (tooltipItems) => `Fecha: ${tooltipItems[0].label}`,
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';

                const raw = context.parsed.y as number | null;
                const value = raw ?? 0;

                label += new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(value);

                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'yyyy-MM-dd'
            },
            title: { display: true, text: 'Fecha' },
            grid: { display: false }
          },
          y: {
            min: yMin,
            max: yMax,
            title: { display: true, text: 'Precio (COP)' },
            grid: { color: '#f1f5f9' }
          }
        }
      }
    });
  }

  // ... (Resto de funciones openReportModal, confirmGeneration, showNotification, getDifferencePercent se mantienen igual)
  openReportModal() {
    if (this.availableCompetitors.length === 0) {
      this.showNotification('Primero debes analizar un producto y obtener resultados.', 'warning');
      return;
    }
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  confirmGeneration() {
    const hasSelection = Object.values(this.reportConfig.selectedCompetitors).some(val => val);
    if (!hasSelection) {
      this.showNotification('Selecciona al menos una empresa para el reporte.', 'warning');
      return;
    }
    if (!this.reportConfig.dateStart || !this.reportConfig.dateEnd) {
      this.showNotification('Por favor define el rango de fechas completo.', 'warning');
      return;
    }
    if (this.reportConfig.dateStart > this.reportConfig.dateEnd) {
      this.showNotification('La fecha de inicio no puede ser mayor a la fecha final.', 'warning');
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
    setTimeout(() => { this.showToast = false; }, 4000);
  }

  getDifferencePercent(myPrice: number, otherPrice: number): number {
    if (!myPrice || !otherPrice) return 0;
    return ((otherPrice - myPrice) / myPrice) * 100;
  }
}
