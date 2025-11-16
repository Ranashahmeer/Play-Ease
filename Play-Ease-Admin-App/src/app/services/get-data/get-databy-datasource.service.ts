import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetDatabyDatasourceService {
  private apiUrl = 'http://localhost:5000/api/GetDataFromDatasource/GetDataByDataSource';

  constructor(private http: HttpClient) {}

  getData(dataSourceId: number, whereClause: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('dataSourceId', dataSourceId)
      .set('whereClause', whereClause);

    return this.http.get<any>(this.apiUrl, { params });
  }

}
