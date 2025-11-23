import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  totalPrice: number = 0;
  totalCount: number = 0;
  isLoading: boolean = false;
  cartError: string | null = null;

  // VARIABLES PARA EL MODAL (POP-UP)
  showModal: boolean = false;
  modalMessage: string = '';
  actionType: 'delete' | 'clear' | null = null; // Qué vamos a hacer: borrar uno o vaciar todo
  itemToDeleteId: string | null = null;
  isProcessing: boolean = false; // Para mostrar spinner en el botón del modal

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.isLoading = true;
    this.cartError = null;

    this.apiService.getCart().subscribe({
      next: (response: any) => {
        const payload = response.data || response;
        if (payload && Array.isArray(payload.items)) {
          this.cartItems = payload.items;
          this.totalPrice = Number(payload.totalPrice) || 0;
          this.totalCount = Number(payload.totalCount) || 0;
        } else {
          this.cartItems = [];
          this.totalPrice = 0;
          this.totalCount = 0;
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Error cargando carrito:', err);
        this.isLoading = false;
        if (err.status === 404) { this.cartItems = []; return; }
        if (err.status === 401) { this.cartError = 'Tu sesión expiró.'; return; }
        this.cartError = 'No se pudo cargar el carrito.';
      }
    });
  }

  // --- FUNCIONES DEL MODAL ---

  // 1. Preguntar antes de eliminar UN producto
  askDeleteItem(itemId: string, productName: string) {
    this.modalMessage = `¿Estás seguro de eliminar "${productName}"?`;
    this.actionType = 'delete';
    this.itemToDeleteId = itemId;
    this.showModal = true;
  }

  // 2. Preguntar antes de vaciar TODO
  askClearCart() {
    this.modalMessage = '¿Seguro que quieres vaciar todo tu carrito?';
    this.actionType = 'clear';
    this.showModal = true;
  }

  // 3. Cancelar y cerrar
  closeModal() {
    this.showModal = false;
    this.actionType = null;
    this.itemToDeleteId = null;
    this.isProcessing = false;
  }

  // 4. Confirmar y ejecutar la acción
  confirmAction() {
    this.isProcessing = true;

    if (this.actionType === 'delete' && this.itemToDeleteId) {
      // Eliminar Item
      this.apiService.removeFromCart(this.itemToDeleteId).subscribe({
        next: () => {
          this.loadCart(); // Recargar visualmente
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.closeModal();
        }
      });
    } else if (this.actionType === 'clear') {
      // Vaciar Carrito
      this.apiService.clearCart().subscribe({
        next: () => {
          this.cartItems = [];
          this.totalPrice = 0;
          this.totalCount = 0;
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.closeModal();
        }
      });
    }
  }
}
