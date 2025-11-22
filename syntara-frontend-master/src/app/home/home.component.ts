import {Component, OnInit} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../auth.service';
import {SearchResult, SearchService} from '../search.service';
import {ApiService} from '../api.service';
import { trigger, style, transition, animate, query, stagger } from '@angular/animations';
import { TypewriterDirective } from '../typewriter.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TypewriterDirective],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [ // Cada vez que cambie la lista
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [ // Retraso de 100ms entre cada elemento
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HomeComponent implements OnInit {

  // Variables del formulario
  searchQuery: string = '';
  quantity: number | null = 1;
  measure: string = ''; // -> se mapea a 'unit'

  // Variables de estado y resultados
  lastSearchQuery: string = '';
  lastSearchQuantity: number = 1;
  lastSearchMeasure: string = '';
  hasSearched: boolean = false;
  isLoading: boolean = false;
  results: (SearchResult & { measureLabel: string })[] = [];

  // Variables de error
  productError: string | null = null;
  measureError: string | null = null;
  generalError: string | null = null; // Para errores de API
  greetingName: string = '';

  // Variable para el texto del título animado
  resultsTitleText: string = '';

  // Inyectar SearchService
  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.name) {
        this.greetingName = `${user.name}`;
      } else {
        this.greetingName = '';
      }
    });
  }

  onSearch() {
    // Limpiar todos los errores al iniciar
    this.productError = null;
    this.measureError = null;
    this.generalError = null;
    this.results = [];

    // Validaciones
    if (!this.searchQuery.trim()) {
      this.productError = 'Escribe un producto.';
    }
    if (!this.measure || this.measure === '') {
      this.measureError = 'Selecciona una unidad.';
    }
    if (this.productError || this.measureError) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.lastSearchQuery = this.searchQuery;
    this.lastSearchQuantity = this.quantity || 1;
    this.lastSearchMeasure = this.measure;

    // Texto que se escribirá automáticamente
    this.resultsTitleText = `Resultados para: ${this.lastSearchQuery} (${this.lastSearchQuantity} ${this.lastSearchMeasure})`;

    this.apiService.searchProducts(
      this.lastSearchQuery,
      this.lastSearchQuantity,
      this.lastSearchMeasure
    ).subscribe({
      next: (response: any) => {

        const payload = response.data || response;
        const resultsArray = payload.results || [];
        const shortMeasure = this.getMeasureAbbreviation(this.lastSearchMeasure);
        this.results = resultsArray.map((result: any) => ({
          ...result,
          measureLabel: shortMeasure
        }));
        // Ordenamos por precio
        this.results.sort((a, b) => a.price - b.price);
        // Limpiamos solo los campos principales del formulario
        this.searchQuery = '';
        this.quantity = 1;
        this.measure = '';
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error en la búsqueda:', err);
        this.generalError = 'Error al conectar con el backend. (¿Interceptor y token OK?)';
        this.isLoading = false;
      }
    });
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
