import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { SearchResult } from '../search.service';
import { ApiService } from '../api.service';
import { trigger, style, transition, animate, query, stagger } from '@angular/animations';
import { TypewriterDirective } from '../typewriter.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TypewriterDirective, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
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
export class HomeComponent implements OnInit {

  // ... Variables de búsqueda existentes ...
  searchQuery: string = '';
  quantity: number | null = 1;
  measure: string = '';
  lastSearchQuery: string = '';
  lastSearchQuantity: number = 1;
  lastSearchMeasure: string = '';
  hasSearched: boolean = false;
  isLoading: boolean = false;

  // Resultados
  results: (SearchResult & { measureLabel: string })[] = [];

  // Errores
  productError: string | null = null;
  measureError: string | null = null;
  generalError: string | null = null;
  quantityError: string | null = null;

  // UI Info
  greetingName: string = '';
  resultsTitleText: string = '';
  showGuestBlockModal: boolean = false;
  showLimitModal: boolean = false;

  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  // --- PERMISOS DE USUARIO ---
  isEnterpriseUser: boolean = false; // Para vista Enterprise completa
  hasProFeatures: boolean = false;   // Para ver detalles (Pro + Enterprise)

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.greetingName = (user && user.name) ? `${user.name}` : '';
    });
    this.checkUserPlan();
  }

  checkUserPlan() {
    if (this.authService.isLoggedIn()) {
      this.apiService.getMyPlan().subscribe({
        next: (plan) => {
          console.log('Plan actual:', plan);

          // Verificar Enterprise (Vista especial)
          this.isEnterpriseUser = (plan && plan.type === 'Enterprise');

          // Verificar ProFeatures (Para ver columna detalles)
          // Tanto Pro como Enterprise pueden ver detalles
          if (plan && (plan.type === 'Pro' || plan.type === 'Enterprise')) {
            this.hasProFeatures = true;
          } else {
            this.hasProFeatures = false;
          }
        },
        error: (err) => {
          console.error('Error verificando plan', err);
          this.isEnterpriseUser = false;
          this.hasProFeatures = false;
        }
      });
    }
  }

  preventInvalidCharacters(event: KeyboardEvent): void {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onSearch() {
    this.productError = null;
    this.measureError = null;
    this.generalError = null;
    this.quantityError = null;
    this.results = [];

    if (!this.searchQuery.trim()) { this.productError = 'Escribe un producto.'; }
    if (!this.quantity || this.quantity <= 0) { this.quantityError = 'Mínimo 1.'; }
    if (!this.measure) { this.measureError = 'Selecciona una unidad.'; }
    if (this.productError || this.measureError) return;

    if (!this.authService.isLoggedIn()) {
      const guestSearches = Number(localStorage.getItem('syntara_guest_searches') || 0);
      if (guestSearches >= 1) {
        this.showGuestBlockModal = true;
        return;
      }
      localStorage.setItem('syntara_guest_searches', (guestSearches + 1).toString());
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.lastSearchQuery = this.searchQuery;
    this.lastSearchQuantity = this.quantity || 1;
    this.lastSearchMeasure = this.measure;
    this.resultsTitleText = `Resultados para: ${this.lastSearchQuery} (${this.lastSearchQuantity} ${this.lastSearchMeasure})`;

    this.apiService.searchProducts(this.lastSearchQuery, this.lastSearchQuantity, this.lastSearchMeasure)
      .subscribe({
        next: (response: any) => {
          const payload = response.data || response;
          const resultsArray = payload.results || [];
          const shortMeasure = this.getMeasureAbbreviation(this.lastSearchMeasure);

          this.results = resultsArray.map((result: any) => ({
            ...result,
            measureLabel: shortMeasure
          }));

          this.results.sort((a: any, b: any) => a.price - b.price);
          this.searchQuery = '';
          this.quantity = 1;
          this.measure = '';
          this.isLoading = false;
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error en búsqueda:', err);

          if (err.status === 403) {
            this.showLimitModal = true;
          } else {
            this.generalError = 'Ocurrió un error al conectar con el servidor.';
          }
        }
      });
  }

  closeGuestModal() { this.showGuestBlockModal = false; }
  closeLimitModal() { this.showLimitModal = false; }

  addToCart(item: any) {
    if (!this.authService.isLoggedIn()) {
      this.showNotification('Inicia sesión para agregar productos', 'error');
      setTimeout(() => this.router.navigate(['/login']), 1500);
      return;
    }
    const cleanPrice = Number(item.price);
    const cleanQuantity = Number(this.lastSearchQuantity);

    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      this.showNotification('Error: El producto tiene un precio inválido.', 'error');
      return;
    }

    const cartItemPayload = {
      id: item._id ?? item.id ?? null,
      product: item.product ?? "",
      price: cleanPrice,
      store: item.store ?? "",
      url: item.url ?? null,
      quantity: cleanQuantity > 0 ? cleanQuantity : 1,
      unit: this.lastSearchMeasure || 'unidad'
    };

    this.apiService.addToCart(cartItemPayload).subscribe({
      next: (res) => {
        this.showNotification(`¡${item.product} agregado al carrito!`, 'success');
      },
      error: (err) => {
        console.error("❌ Error del servidor:", err);
        let msg = 'No se pudo agregar el producto.';
        if (err.status === 400) msg = 'Error de validación.';
        if (err.status === 401) msg = 'Sesión expirada.';
        this.showNotification(msg, 'error');
      }
    });
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 3000);
  }

  private getMeasureAbbreviation(fullMeasure: string): string {
    const map: { [key: string]: string } = {
      'unidades': 'und', 'pares': 'par', 'docenas': 'doc', 'cajas': 'caja',
      'paquetes': 'paq', 'bolsas': 'bolsa', 'kits': 'kit', 'kilogramos': 'kg',
      'gramos': 'g', 'libras': 'lb', 'arrobas': 'arroba', 'quintales': 'qq',
      'bultos': 'bulto', 'litros': 'L', 'mililitros': 'ml', 'galones': 'gal',
      'metros': 'm', 'centimetros': 'cm', 'metros_cuadrados': 'm²'
    };
    return map[fullMeasure] || fullMeasure;
  }

  // Helper para mostrar info segura en el popover
  getDetailsContent(item: SearchResult): string {
    if (item.productDetails) return item.productDetails;
    if (item.raw && item.raw.notes) return item.raw.notes;
    return 'Información técnica verificada por Syntara AI.';
  }
}
