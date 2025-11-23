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
  isLoading: boolean = true;
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
        console.log('📥 Datos recibidos del carrito:', data); // <--- ¡MIRA LA CONSOLA!

        // Verificamos si data tiene la estructura esperada
        if (data && data.items) {
          this.cartItems = data.items;
          this.totalPrice = data.totalPrice || 0;
          this.totalCount = data.totalCount || 0;
        } else {
          // Si llega vacío o diferente, inicializamos en 0
          this.cartItems = [];
          this.totalPrice = 0;
          this.totalCount = 0;
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Error cargando carrito:', err);
        this.cartError = 'No se pudo cargar tu carrito. Revisa tu conexión.';
        this.isLoading = false;
      }
    });
  }

  removeItem(itemId: string) {
    if (!confirm('¿Deseas eliminar este producto?')) return;

    this.apiService.removeFromCart(itemId).subscribe({
      next: () => {
        this.loadCart(); // Recargamos para actualizar lista y total
      },
      error: (err) => console.error('Error eliminando:', err)
    });
  }

  clearCart() {
    if (!confirm('¿Vaciar todo el carrito?')) return;

    this.apiService.clearCart().subscribe({
      next: () => {
        this.cartItems = [];
        this.totalPrice = 0;
        this.totalCount = 0;
      },
      error: (err) => console.error(err)
    });
  }
}
