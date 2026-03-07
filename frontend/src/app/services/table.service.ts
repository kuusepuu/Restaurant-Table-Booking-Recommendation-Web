import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestaurantTable } from '../models/table.model';

@Injectable({
  providedIn: 'root'  // singleton — one instance for whole app
})
export class TableService {
  private apiUrl = '/api/tables';

  constructor(private http: HttpClient) {}

  getAllTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(this.apiUrl);
  }

  // Not currently used, but could be helpful for future features
  getTableById(id: number): Observable<RestaurantTable> {
    return this.http.get<RestaurantTable>(`${this.apiUrl}/${id}`);
  }

  // This method is not currently used in the app, but it could be useful for future features
  getAvailableTables(
    date: string,
    startTime: string,
    endTime: string,
    groupSize: number
  ): Observable<RestaurantTable[]> {
    const params = { date, startTime, endTime, groupSize: groupSize.toString() };
    return this.http.get<RestaurantTable[]>(`${this.apiUrl}/available`, { params });
  }
}

