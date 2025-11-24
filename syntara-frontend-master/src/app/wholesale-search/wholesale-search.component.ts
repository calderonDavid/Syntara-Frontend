import { Component } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { trigger, style, transition, animate, query, stagger } from '@angular/animations';
import { TypewriterDirective } from '../typewriter.directive';

@Component({
  selector: 'app-wholesale-search',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, TypewriterDirective],
  templateUrl: './wholesale-search.component.html',
  styleUrls: ['./wholesale-search.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class WholesaleSearchComponent {

  searchQuery: string = '';
  quantity: number | null = 1;
  measure: string = '';

  hasSearched: boolean = false;
  isLoading: boolean = false;
  results: any[] = [];

  resultsTitleText: string = '';
  generalError: string | null = null;

  productError: string | null = null;
  measureError: string | null = null;
  quantityError: string | null = null;

  constructor(private apiService: ApiService) {}

  preventInvalidCharacters(event: KeyboardEvent): void {
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onSearch() {
    this.productError = null;
    this.measureError = null;
    this.quantityError = null;
    this.generalError = null;
    this.results = [];

    if (!this.searchQuery.trim()) {
      this.productError = 'Escribe un producto.';
    }
    if (!this.quantity || this.quantity <= 0) {
      this.quantityError = 'Mínimo 1.';
    }
    if (!this.measure) {
      this.measureError = 'Selecciona unidad.';
    }

    if (this.productError || this.measureError) return;

    this.isLoading = true;
    this.hasSearched = true;
    this.resultsTitleText = `Cotización Mayorista: ${this.searchQuery}`;

    this.apiService.searchWholesale(this.searchQuery, this.quantity, this.measure)
      .subscribe({
        next: (response: any) => {
          const payload = response.data || response;
          const resultsArray = payload.results || [];
          this.results = resultsArray.sort((a: any, b: any) => a.price - b.price);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error en búsqueda mayorista:', err);
          this.isLoading = false;
          this.generalError = err.error?.message || 'Ocurrió un error al buscar precios mayoristas.';
        }
      });
  }
}
