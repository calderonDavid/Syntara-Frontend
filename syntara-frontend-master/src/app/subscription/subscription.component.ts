import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent {

  // Variables para el Modal Empresarial
  showEnterpriseModal: boolean = false;
  isLoading: boolean = false;
  successMessage: string | null = null;
  companyName: string = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  selectPlan(planType: 'Pro' | 'Enterprise') {
    if (planType === 'Pro') {
      this.router.navigate(['/payment']);
    } else {
      this.showEnterpriseModal = true;
    }
  }

  activateEnterprise() {
    if (!this.companyName.trim()) {
      alert('Por favor ingresa el nombre de tu empresa.');
      return;
    }
    this.isLoading = true;

    this.apiService.updateUserProfile({
      name: this.companyName,
      lastname: ""
    }).subscribe({
      next: () => {
        console.log('Perfil actualizado a Empresa');

        this.assignEnterprisePlan();
      },
      error: (err) => {
        console.error('Error actualizando perfil:', err);
        this.isLoading = false;
        alert('No pudimos actualizar el nombre de la empresa.');
      }
    });
  }

  private assignEnterprisePlan() {
    this.apiService.assignPlan('Enterprise').subscribe({
      next: (res) => {
        console.log('Plan Enterprise activado:', res);

        this.authService.updateUserLocal({
          isSubscribed: true,
          name: this.companyName,
          lastname: ""
        });

        this.isLoading = false;
        this.successMessage = '¡Listo! Tu cuenta ahora es Enterprise.';

        setTimeout(() => {
          this.closeModal();
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (err) => {
        console.error('Error activando Enterprise:', err);
        this.isLoading = false;
        alert('Hubo un error al activar el plan.');
      }
    });
  }

  closeModal() {
    this.showEnterpriseModal = false;
    this.successMessage = null;
    this.companyName = '';
  }
}
