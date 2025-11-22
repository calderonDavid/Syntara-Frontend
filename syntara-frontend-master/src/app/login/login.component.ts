import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, Validators, FormGroup} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../auth.service';
import {ApiService} from '../api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loginPasswordVisible: boolean = false;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]],
    });
  }

  toggleLoginPass() {
    this.loginPasswordVisible = !this.loginPasswordVisible;
  }

  onLoginSubmit() {
    this.loginError = null;
    if (this.loginForm.valid) {
      const formValue = this.loginForm.value;
      const payload = {
        email: formValue.correo,
        password: formValue.contrasena
      };

      console.log('Enviando datos de login al backend:', payload);

      this.apiService.login(payload).subscribe({
        next: (response) => {
          console.log('Login exitoso!', response);
          this.router.navigate(['/']);
          this.loginForm.reset();
        },
        error: (err) => {
          console.error('Error en el login:', err);
          let backendMessage = 'Credenciales incorrectas o el servidor no responde.';
          if (err.error && err.error.message) {
            backendMessage = err.error.message;
          } else if (err.error && typeof err.error === 'string') {
            backendMessage = err.error;
          } else if (err.statusText) {
            backendMessage = err.statusText;
          }
          this.loginError = `Error: ${backendMessage}`;
        }
      });
    } else {
      console.log('Formulario de login inválido');
      this.loginError = 'Por favor, introduce un correo y contraseña válidos.';
    }
  }
}
