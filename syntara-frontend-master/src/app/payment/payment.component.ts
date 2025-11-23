import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {
  showSuccessMessage = false;
  isProcessing = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
  private authService: AuthService
  ) { }

  onSubmit() {
    console.log('Procesando pago...');
    this.isProcessing = true;

    // Simulamos demora de pago y luego llamamos al backend
    setTimeout(() => {

      // LLAMADA AL BACKEND PARA ASIGNAR PLAN PRO
      this.apiService.assignPlan('Pro').subscribe({
        next: (res) => {
          console.log('Plan Pro activado:', res);
          this.authService.updateUserLocal({ isSubscribed: true });
          this.showSuccessMessage = true;
          this.isProcessing = false;

          // Redirigir después de mostrar éxito
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 3000);
        },
        error: (err) => {
          console.error('Error activando Plan Pro:', err);
          this.isProcessing = false;
          alert('El pago fue procesado pero hubo un error activando tu cuenta. Contacta soporte.');
        }
      });

    }, 1500); // Simulación de espera de pasarela
  }
}
