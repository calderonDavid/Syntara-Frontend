import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {
  showSuccessMessage = false;

  constructor(private router: Router) { }

  onSubmit() {
    console.log('Formulario de pago enviado (Simulando API...)');
    this.showSuccessMessage = true;

    setTimeout(() => {
      this.router.navigate(['/']);
    }, 3000);
  }
}
