import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: string;
  isSubscribed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private tokenKey = 'authToken';
  private userKey = 'user';

  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();

  constructor(private router: Router) {
    const savedUser = localStorage.getItem(this.userKey);
    if (savedUser) {
      try {
        this._currentUser.next(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error al recuperar sesión, limpiando...', e);
        this.logout();
      }
    }
  }

  getCurrentUser(): User | null {
    return this._currentUser.getValue();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  login(user: User, token: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this._currentUser.next(user);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this._currentUser.next(null);
    this.router.navigate(['/login']);
  }
  updateUserLocal(partialData: Partial<User>) {
    const current = this.getCurrentUser();
    if (current) {
      const updated = { ...current, ...partialData };
      this.updateLocalStorageUser(updated);
    }
  }

  private updateLocalStorageUser(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this._currentUser.next(user);
  }
}
