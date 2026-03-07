import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchCriteria, TableRecommendation } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = '/api/bookings/recommend';

  constructor(private http: HttpClient) {}

  recommend(criteria: SearchCriteria): Observable<TableRecommendation[]> {
    return this.http.post<TableRecommendation[]>(this.apiUrl, criteria);
  }
}

