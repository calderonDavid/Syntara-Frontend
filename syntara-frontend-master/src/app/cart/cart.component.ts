import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import { RouterLink } from '@angular/router';

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

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.isLoading = true;
    this.cartError = null;

    this.apiService.getCart().subscribe({
      next: (data) => {
        // El backend devuelve { items, totalPrice, totalCount }
        this.cartItems = data.items || [];
        this.totalPrice = data.totalPrice || 0;
        this.totalCount = data.totalCount || 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando carrito:', err);
        this.cartError = 'No se pudo cargar el carrito. Intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  removeItem(itemId: string) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    // Opcional: Mostrar loading mientras elimina
    // this.isLoading = true;

    this.apiService.removeFromCart(itemId).subscribe({
      next: () => {
        this.loadCart(); // Recargar para actualizar totales
      },
      error: (err) => {
        console.error(err);
        alert('Error al eliminar el producto.');
        // this.isLoading = false;
      }
    });
  }

  clearCart() {
    if (!confirm('¿Estás seguro de vaciar todo el carrito?')) return;

    this.apiService.clearCart().subscribe({
      next: () => {
        this.cartItems = [];
        this.totalPrice = 0;
        this.totalCount = 0;
      },
      error: (err) => {
        console.error(err);
        alert('Error al vaciar el carrito.');
      }
    });
  }
}
