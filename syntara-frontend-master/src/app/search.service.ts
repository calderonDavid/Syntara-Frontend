import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SearchData {
  product: string;
  quantity: number;
  unit: string;
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
  productDetails?: string;
  raw?: any;
}

@Injectable({
  providedIn: 'root'
})

export class SearchService {
  private apiUrl = 'http://10.195.23.48:3000/api/search';

  constructor(private http: HttpClient) {
  }


  search(data: SearchData): Observable<{ results: SearchResult[] }> {
    const clientDate = new Date().toISOString();

    let params = new HttpParams()
      .set('product', data.product)
      .set('quantity', data.quantity.toString())
      .set('unit', data.unit)
      .set('clientDate', clientDate);

    return this.http.get<{ results: SearchResult[] }>(this.apiUrl, { params });
  }
}
