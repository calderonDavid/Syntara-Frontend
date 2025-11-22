import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const contrasena = control.get('contrasena');
  const verificarContrasena = control.get('verificarContrasena');
  if (!contrasena || !verificarContrasena || !contrasena.value || !verificarContrasena.value) {
    return null;
  }
  return contrasena.value === verificarContrasena.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  registerPasswordVisible: boolean = false;
  registerVerifyVisible: boolean = false;
  registerError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      verificarContrasena: ['', Validators.required],
    }, {
      validators: passwordMatchValidator
    });
  }

  toggleRegPass() { this.registerPasswordVisible = !this.registerPasswordVisible; }
  toggleRegVerify() { this.registerVerifyVisible = !this.registerVerifyVisible; }

  onRegisterSubmit() {
    this.registerError = null;

    if (this.registerForm.valid) {
      // obtenemos los valores del formulario
      const formValue = this.registerForm.value;

      // Toca tarducir el payload a INGLÉS (como lo espera el backend User.js), porque no sabiamos que había incompatibilidad con nombres
      const payload = {
        name: formValue.nombre,         // 'nombre' -> 'name'
        lastname: formValue.apellido,   // 'apellido' -> 'lastname'
        email: formValue.correo,        // 'correo' -> 'email'
        password: formValue.contrasena  // 'contrasena' -> 'password'
      };
      // El backend (User.js) maneja 'role' y 'createdAt' automáticamente.
      console.log('Enviando datos TRADUCIDOS al backend:', payload);

      // Se envia el 'payload' completo al ApiService
      this.apiService.register(payload).subscribe({
        next: (response) => {
          console.log('Registro exitoso!', response)
          console.log('¡Registro exitoso! Ahora inicia sesión.');

          this.router.navigate(['/login']);
          this.registerForm.reset();
        },
        error: (err) => {
          console.error('Error en el registro:', err);
          let backendMessage = 'El servidor no responde o hay un problema desconocido.';

          if (err.error && err.error.message) {
            backendMessage = err.error.message;
          } else if (err.error && typeof err.error === 'string') {
            backendMessage = err.error;
          } else if (err.statusText) {
            backendMessage = err.statusText;
          }
          this.registerError = `Error: ${backendMessage}`;
        }
      });

    } else {
      console.log('Formulario de registro inválido');
      this.registerError = 'Por favor, completa todos los campos correctamente.';
    }
  }
}
