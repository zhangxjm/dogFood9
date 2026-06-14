import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Consultation, ConsultationCreateRequest, ConsultationComment, ConsultationStatus } from '../models/consultation.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = '/api/consultations';

  constructor(private http: HttpClient) {}

  getConsultations(params?: { status?: ConsultationStatus; page?: number; pageSize?: number }): Observable<{ data: Consultation[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<{ data: Consultation[]; total: number }>(`${this.apiUrl}/`, { params: httpParams });
  }

  getConsultation(id: number): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}/`);
  }

  createConsultation(request: ConsultationCreateRequest): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/`, request);
  }

  addComment(consultationId: number, content: string): Observable<ConsultationComment> {
    return this.http.post<ConsultationComment>(`${this.apiUrl}/${consultationId}/comments/`, { content });
  }

  closeConsultation(id: number): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/close/`, {});
  }

  getExperts(): Observable<{ id: number; name: string; department: string; title: string }[]> {
    return this.http.get<{ id: number; name: string; department: string; title: string }[]>(`${this.apiUrl}/experts/`);
  }
}
