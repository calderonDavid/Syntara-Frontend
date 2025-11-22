import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
  isSubscribed?: boolean; // Este campo lo manejaremos localmente
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Claves para guardar en localStorage
  private tokenKey = 'authToken';
  private userKey = 'user';

  //BehaviorSubject para el estado del usuario
  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();

  constructor(private router: Router) {
    // Al cargar, intentar recuperar la sesión
    const savedUser = localStorage.getItem(this.userKey);
    if (savedUser) {
      try {
        this._currentUser.next(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error al recuperar sesión, limpiando...', e);
        this.logout(); // Limpia si los datos están corruptos
      }
    }
  }

  // Metodo auxiliar para obtener el usuario actual
  getCurrentUser(): User | null {
    return this._currentUser.getValue();
  }

  // Metodo para que el Interceptor lea el token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Metodo para saber si está autenticado
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  // "Login" (guardar estado) - Este es llamado por ApiService
  login(user: User, token: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this._currentUser.next(user);
  }

  // "Logout" (limpiar estado)
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this._currentUser.next(null);
    this.router.navigate(['/login']);
  }
}
