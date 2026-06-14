import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Nodule, MalignancyLevel } from '../models/nodule.model';

@Injectable({
  providedIn: 'root'
})
export class NoduleService {
  private apiUrl = '/api/nodules';

  constructor(private http: HttpClient) {}

  getNodules(params?: { studyId?: number; malignancyLevel?: MalignancyLevel; page?: number; pageSize?: number }): Observable<{ data: Nodule[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.studyId) httpParams = httpParams.set('studyId', params.studyId.toString());
    if (params?.malignancyLevel) httpParams = httpParams.set('malignancyLevel', params.malignancyLevel);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<{ data: Nodule[]; total: number }>(`${this.apiUrl}/`, { params: httpParams });
  }

  getNodule(id: number): Observable<Nodule> {
    return this.http.get<Nodule>(`${this.apiUrl}/${id}/`);
  }

  getNodulesByStudy(studyId: number): Observable<Nodule[]> {
    return this.http.get<Nodule[]>(`${this.apiUrl}/study/${studyId}/`);
  }

  updateNodule(id: number, data: Partial<Nodule>): Observable<Nodule> {
    return this.http.put<Nodule>(`${this.apiUrl}/${id}/`, data);
  }

  deleteNodule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
