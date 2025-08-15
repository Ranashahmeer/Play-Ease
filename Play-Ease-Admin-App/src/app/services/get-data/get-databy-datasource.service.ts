import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetDatabyDatasourceService {
  private apiUrl = 'https://localhost:7267/GetDataByDataSource';

  constructor(private http: HttpClient) {}

  getData(dataSourceId: number, whereClause: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('dataSourceId', dataSourceId)
      .set('whereClause', whereClause);

    return this.http.get<any>(this.apiUrl, { params });
  }

}
