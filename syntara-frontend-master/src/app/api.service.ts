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
  getCart(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cart`);
  }

  addToCart(item: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart/add`, item);
  }

  removeFromCart(itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/item/${itemId}`);
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/clear`);
  }
  // ASIGNAR SUBCRIPCION
  getMyPlan(): Observable<any> {
    return this.http.get(`${this.baseUrl}/subscriptions/my-plan`);
  }
  // Asignar un plan (usado en el paso anterior)
  assignPlan(planName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/subscriptions/assign`, { plan: planName });
  }
  updateUserProfile(data: { name?: string, lastname?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/update`, data);
  }
  //REPORTE COMPETENCIA
  getCompetitorReport(query: string): Observable<any> {
    // Usamos el endpoint de comparación de precios
    return this.http.post(`${this.baseUrl}/reports/generate`, { product: query });
  }
  //REPORTE TENDENCIA
  getDistributorReport(storeName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reports/distributor-intelligence`, { storeName });
  }
  // BÚSQUEDA MAYORISTA
  searchWholesale(product: string, quantity: number | null, unit: string): Observable<any[]> {
    let params = new HttpParams();
    if (product) params = params.append('product', product);
    if (quantity !== null) params = params.append('quantity', quantity.toString());
    if (unit) params = params.append('unit', unit);

    // Usamos clientDate igual que en la búsqueda normal
    const clientDate = new Date().toISOString();
    params = params.append('clientDate', clientDate);

    // NOTA: Endpoint específico configurado en tu backend searchRoutes.js
    return this.http.get<any[]>(`${this.baseUrl}/search/wholesale`, { params });
  }
}

