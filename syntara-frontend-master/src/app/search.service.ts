import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Importar HttpParams
import { Observable } from 'rxjs';

// Se ajusta la interfaz para reflejar los datos que el componente DEBE enviar
export interface SearchData {
  product: string;
  quantity: number;
  unit: string;
  // Se ha quitado clientDate de aquí, ya que se generará en el servicio o componente que llama.
  // En este caso, el servicio lo generará para asegurar que siempre esté presente.
}

export interface SearchResult {
  product: string;
  store: string;
  price: number;
  unitPrice: number | null;
  currency: "COP";
  url: string | null;
  date: string;
  confidence: number;
  isOffer?: boolean;
}

@Injectable({
  providedIn: 'root'
})

export class SearchService {
  private apiUrl = 'http://192.168.4.217:3000/api/search';

  constructor(private http: HttpClient) {
  }

  // Se modifica la firma para ser más limpia y compatible con el backend (GET)
  search(data: SearchData): Observable<{ results: SearchResult[] }> {

    // 1. Obtener la fecha y hora actual de la PC del cliente
    // El método toISOString() garantiza el formato ISO 8601, compatible con new Date() en el backend.
    const clientDate = new Date().toISOString(); // ✅ CORRECCIÓN CLAVE: Genera la fecha del cliente.

    // 2. Crear los parámetros de consulta (query parameters)
    // Esto es necesario para que el backend lo reciba como req.query.
    let params = new HttpParams()
      .set('product', data.product)
      .set('quantity', data.quantity.toString()) // Convertir a string para la URL
      .set('unit', data.unit)
      .set('clientDate', clientDate); // ✅ Incluye la fecha del cliente en los parámetros

    // 3. Llama al endpoint usando GET
    // Usamos GET para coincidir con la forma en que el backend lee los parámetros (req.query)
    // Los parámetros se adjuntan automáticamente a la URL.
    // El interceptor se encargará de añadir el token.
    return this.http.get<{ results: SearchResult[] }>(this.apiUrl, { params });
  }
}
