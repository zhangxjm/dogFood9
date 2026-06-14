import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Study, StudyCreateRequest, StudyStatus } from '../models/study.model';

@Injectable({
  providedIn: 'root'
})
export class StudyService {
  private apiUrl = '/api/studies';

  constructor(private http: HttpClient) {}

  getStudies(params?: { keyword?: string; status?: StudyStatus; page?: number; pageSize?: number }): Observable<{ data: Study[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<{ data: Study[]; total: number }>(`${this.apiUrl}/`, { params: httpParams });
  }

  getStudy(id: number): Observable<Study> {
    return this.http.get<Study>(`${this.apiUrl}/${id}/`);
  }

  createStudy(request: StudyCreateRequest): Observable<Study> {
    return this.http.post<Study>(`${this.apiUrl}/`, request);
  }

  uploadDicom(studyId: number, files: File[]): Observable<{ progress: number }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<{ progress: number }>(`${this.apiUrl}/${studyId}/upload/`, formData);
  }

  analyzeStudy(id: number): Observable<Study> {
    return this.http.post<Study>(`${this.apiUrl}/${id}/analyze/`, {});
  }

  getStudiesByPatient(patientId: number): Observable<Study[]> {
    return this.http.get<Study[]>(`${this.apiUrl}/patient/${patientId}/`);
  }
}
