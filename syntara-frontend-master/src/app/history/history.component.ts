import {Component, OnInit} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {ApiService} from '../api.service';

export interface HistoryItem {
  id: string;
  product: string;
  quantity: number;
  unit: string;
  date: Date;
  url: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  searchHistory: HistoryItem[] = [];
  isLoadingHistory: boolean = false;
  historyError: string | null = null;

  // Variables para el Modal de confirmación
  showConfirmModal: boolean = false;
  isClearing: boolean = false; // Spinner dentro del modal
  itemToDelete: HistoryItem | null = null; // Para saber qué estamos borrando (null = borrar todo)
  modalMessage: string = ''; // Mensaje dinámico del modal

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.fetchHistory();
  }

  fetchHistory() {
    this.isLoadingHistory = true;
    this.historyError = null;
    this.apiService.getSearchHistory().subscribe({
      next: (response: any) => {
        this.searchHistory = (response.data || response) as HistoryItem[];
        // Ordenar por fecha descendente
        this.searchHistory.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.isLoadingHistory = false;
      },
      error: (err: any) => {
        console.error('Error al cargar el historial:', err);
        this.historyError = 'No se pudo cargar tu historial.';
        this.isLoadingHistory = false;
      }
    });
  }

  onSearchAgain(item: HistoryItem) {
    this.router.navigate(['/'], {
      queryParams: {
        product: item.product,
        quantity: item.quantity,
        unit: item.unit
      }
    });
  }

  //Abrir modal para borrar TODO
  requestClearAll() {
    this.itemToDelete = null; // null indica borrar todo
    this.modalMessage = '¿Estás seguro de que quieres borrar TODO tu historial?';
    this.showConfirmModal = true;
  }

  //Abrir modal para borrar UN ITEM
  requestDeleteItem(item: HistoryItem) {
    this.itemToDelete = item;
    this.modalMessage = '¿Eliminar este registro del historial?';
    this.showConfirmModal = true;
  }

  //Cancelar
  cancelClear() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

  // Confirmar acción
  confirmClear() {
    this.isClearing = true;

    setTimeout(() => {
      if (this.itemToDelete) {
        // Borrar solo uno
        this.deleteSingleItem(this.itemToDelete);
      } else {
        // Borrar todo
        this.deleteAllHistory();
      }
    }, 800);
  }

  private deleteAllHistory() {
    this.apiService.clearSearchHistory().subscribe({
      next: () => {
        this.searchHistory = [];
        this.finalizeAction();
      },
      error: (err) => {
        console.error('Error al borrar historial:', err);
        this.historyError = 'No se pudo borrar el historial.';
        this.finalizeAction();
      }
    });
  }

  private deleteSingleItem(item: HistoryItem) {
    this.apiService.deleteHistoryItem(item.id).subscribe({
      next: () => {
        // Filtrar localmente para no recargar toda la lista
        this.searchHistory = this.searchHistory.filter(h => h.id !== item.id);
        this.finalizeAction();
      },
      error: (err) => {
        console.error('Error al borrar item:', err);
        // Opcional: mostrar error en UI
        this.finalizeAction();
      }
    });
  }

  private finalizeAction() {
    this.isClearing = false;
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
}
