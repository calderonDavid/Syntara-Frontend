import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
// IMPORTAR ANIMACIONES
import { trigger, style, transition, animate } from '@angular/animations';

// ... (Interfaces Competitor y ProductComparison siguen igual)

@Component({
  selector: 'app-competitor-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './competitor-report.component.html',
  styleUrls: ['./competitor-report.component.scss'],
  // AGREGAR ANIMACIÓN DEL TOAST
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
export class CompetitorReportComponent implements OnInit {

  // ... (variables existentes targetProduct, myStoreName, etc) ...
  targetProduct: string = '';
  myStoreName: string = '';
  isLoading: boolean = false;
  reportData: any = null;
  competitors: any[] = [];
  errorMessage: string | null = null;

  // VARIABLES PARA EL TOAST
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  // ... (ngOnInit, generateReport, processData, getDifferencePercent siguen IGUAL) ...

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user && user.name) {
      this.myStoreName = user.name;
    }
  }

  generateReport() {
    // ... (tu código existente)
    if (!this.targetProduct.trim()) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.reportData = null;
    this.competitors = [];

    this.apiService.getCompetitorReport(this.targetProduct).subscribe({
      next: (res: any) => {
        const rawPrices = res.data || [];
        this.processData(rawPrices);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.errorMessage = 'No pudimos generar el reporte. Intenta con otro producto.';
      }
    });
  }

  processData(prices: any[]) {
    if (!prices || prices.length === 0) {
      this.errorMessage = 'No se encontraron registros para este producto en ninguna tienda.';
      return;
    }
    const myRecord = prices.find(p => p.store.toLowerCase().includes(this.myStoreName.toLowerCase()));
    const others = prices.filter(p => !p.store.toLowerCase().includes(this.myStoreName.toLowerCase()));

    this.reportData = {
      productName: this.targetProduct,
      myPrice: myRecord ? myRecord.price : null,
      myDate: myRecord ? myRecord.date : null,
      myUrl: myRecord ? myRecord.url : null
    };
    this.competitors = others;
  }

  getDifferencePercent(myPrice: number, otherPrice: number): number {
    if (!myPrice || !otherPrice) return 0;
    return ((otherPrice - myPrice) / myPrice) * 100;
  }

  // --- NUEVA FUNCIÓN: ENVIAR REPORTE ---
  sendReportEmail() {
    const user = this.authService.getCurrentUser();
    const email = user ? user.email : 'tu correo';

    // Simulamos envío (aquí podrías llamar al backend si fuera real)
    this.showNotification(`Su reporte fue generado y enviado a ${email} con éxito`, 'success');
  }

  // --- HELPER PARA TOAST ---
  private showNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 4000);
  }
}
