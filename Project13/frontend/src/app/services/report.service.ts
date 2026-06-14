import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Report, ReportCreateRequest, ReportStatus } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  getReports(params?: { keyword?: string; status?: ReportStatus; page?: number; pageSize?: number }): Observable<{ data: Report[]; total: number }> {
    let httpParams = new HttpParams();
    if (params?.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<{ data: Report[]; total: number }>(`${this.apiUrl}/`, { params: httpParams });
  }

  getReport(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}/`);
  }

  createReport(request: ReportCreateRequest): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/`, request);
  }

  updateReport(id: number, request: Partial<ReportCreateRequest>): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}/`, request);
  }

  signReport(id: number): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/sign/`, {});
  }

  getReportsByPatient(patientId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/patient/${patientId}/`);
  }

  getReportsByStudy(studyId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/study/${studyId}/`);
  }

  generateFromAi(studyId: number): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/generate/${studyId}/`, {});
  }
}
