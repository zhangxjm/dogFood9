import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PatientCreateRequest } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = '/api/patients';

  constructor(private http: HttpClient) {}

  getPatients(params?: { keyword?: string; page?: number; pageSize?: number }): Observable<{ data: Patient[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<{ data: Patient[]; total: number }>(`${this.apiUrl}/`, { params: httpParams });
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}/`);
  }

  createPatient(request: PatientCreateRequest): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/`, request);
  }

  updatePatient(id: number, request: PatientCreateRequest): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}/`, request);
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
