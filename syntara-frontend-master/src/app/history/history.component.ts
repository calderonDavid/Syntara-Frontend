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
  showConfirmModal: boolean = false;
  isClearing: boolean = false;
  itemToDelete: HistoryItem | null = null;
  modalMessage: string = '';

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

  requestClearAll() {
    this.itemToDelete = null;
    this.modalMessage = '¿Estás seguro de que quieres borrar TODO tu historial?';
    this.showConfirmModal = true;
  }

  requestDeleteItem(item: HistoryItem) {
    this.itemToDelete = item;
    this.modalMessage = '¿Eliminar este registro del historial?';
    this.showConfirmModal = true;
  }

  cancelClear() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

  confirmClear() {
    this.isClearing = true;

    setTimeout(() => {
      if (this.itemToDelete) {
        this.deleteSingleItem(this.itemToDelete);
      } else {
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
        this.searchHistory = this.searchHistory.filter(h => h.id !== item.id);
        this.finalizeAction();
      },
      error: (err) => {
        console.error('Error al borrar item:', err);
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
