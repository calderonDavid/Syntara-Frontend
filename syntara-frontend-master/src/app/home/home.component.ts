import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { SearchResult } from '../search.service';
import { ApiService } from '../api.service';
import { trigger, style, transition, animate, query, stagger } from '@angular/animations';
import { TypewriterDirective } from '../typewriter.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TypewriterDirective],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    // Animación de la lista de resultados
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
    // NUEVA ANIMACIÓN PARA LA NOTIFICACIÓN FLOTANTE (TOAST)
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

  searchQuery: string = '';
  quantity: number | null = 1;
  measure: string = '';
  lastSearchQuery: string = '';
  lastSearchQuantity: number = 1;
  lastSearchMeasure: string = '';
  hasSearched: boolean = false;
  isLoading: boolean = false;
  results: (SearchResult & { measureLabel: string })[] = [];
  productError: string | null = null;
  measureError: string | null = null;
  generalError: string | null = null;
  greetingName: string = '';
  resultsTitleText: string = '';

  // VARIABLES PARA LA NOTIFICACIÓN (TOAST)
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.greetingName = (user && user.name) ? `${user.name}` : '';
    });
  }

  onSearch() {
    this.productError = null;
    this.measureError = null;
    this.generalError = null;
    this.results = [];

    if (!this.searchQuery.trim()) { this.productError = 'Escribe un producto.'; }
    if (!this.measure) { this.measureError = 'Selecciona una unidad.'; }
    if (this.productError || this.measureError) return;

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
          this.results = resultsArray.map((result: any) => ({ ...result, measureLabel: shortMeasure }));
          this.results.sort((a: any, b: any) => a.price - b.price);
          this.searchQuery = '';
          this.quantity = 1;
          this.measure = '';
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error en búsqueda:', err);
          this.generalError = 'Error al conectar con el backend.';
          this.isLoading = false;
        }
      });
  }

  addToCart(item: any) {
    if (!this.authService.isLoggedIn()) {
      this.showNotification('Inicia sesión para agregar productos', 'error');
      setTimeout(() => this.router.navigate(['/login']), 1500);
      return;
    }

    // 1. Convertimos y validamos
    const cleanPrice = Number(item.price);
    const cleanQuantity = Number(this.lastSearchQuantity);

    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      this.showNotification('Error: El producto tiene un precio inválido.', 'error');
      return;
    }

    // 2. Construir payload EXACTO que llega bien al backend
    const cartItemPayload = {
      id: item._id ?? item.id ?? null,   // 👈 garantizamos el id
      product: item.product ?? "",       // 👈 nunca undefined
      price: cleanPrice,
      store: item.store ?? "",
      url: item.url ?? null,
      quantity: cleanQuantity > 0 ? cleanQuantity : 1,
      unit: this.lastSearchMeasure || 'unidad'
    };

    console.log("🚀 Enviando payload limpio:", cartItemPayload);

    // 3. Enviar al backend con JSON correcto
    this.apiService.addToCart(cartItemPayload).subscribe({
      next: (res) => {
        this.showNotification(`¡${item.product} agregado al carrito!`, 'success');
      },
      error: (err) => {
        console.error("❌ Error del servidor:", err);
        let msg = 'No se pudo agregar el producto.';
        if (err.status === 400) msg = 'Error de validación: Revisa los datos del producto.';
        if (err.status === 401) msg = 'Sesión expirada.';
        this.showNotification(msg, 'error');
      }
    });
  }




  // --- FUNCIÓN PARA MOSTRAR EL TOAST (NOTIFICACIÓN) ---
  private showNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
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
}
