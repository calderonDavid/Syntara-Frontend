import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService, User } from './auth.service'; // 💡 '

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://10.195.23.48:3000/api';
  constructor(private http: HttpClient, private authService: AuthService) { }

// LOGIN
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        console.log('Respuesta del backend:', response);
        if (response && response.token && response.user) {
          const userToSave: User = {
            id: response.user.id,
            name: response.user.name,
            lastname: response.user.lastname,
            email: response.user.email,
            role: response.user.role,
            isSubscribed: response.user.isSubscribed || false
          };
          this.authService.login(userToSave, response.token);
        } else {
          console.error('Respuesta de login inválida:', response);
        }
      })
    );
  }

  // REGISTRO
  register(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, userData);
  }

  // BÚSQUEDA
  searchProducts(product: string, quantity: number | null, unit: string): Observable<any[]> {
    let params = new HttpParams();
    if (product) {
      params = params.append('product', product);
    }
    if (quantity !== null && quantity !== undefined) {
      params = params.append('quantity', quantity.toString());
    }
    if (unit) {
      params = params.append('unit', unit);
    }
    return this.http.get<any[]>(`${this.baseUrl}/search`, { params });
  }

  // HISTORIAL
  getSearchHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/search/history`);
  }
  //Todo el historial
  clearSearchHistory(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/search/history`);
  }
  //Búsqueda individual
  deleteHistoryItem(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/search/history/${id}`);
  }
}
