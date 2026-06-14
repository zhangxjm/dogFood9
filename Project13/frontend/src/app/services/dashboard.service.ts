import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  todayExams: number;
  pendingAnalysis: number;
  pendingReports: number;
  pendingConsultations: number;
}

export interface WeeklyTrend {
  labels: string[];
  data: number[];
}

export interface RecentStudy {
  id: number;
  patientName: string;
  studyDate: string;
  studyType: string;
  status: string;
}

export interface RecentReport {
  id: number;
  patientName: string;
  reportType: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats/`);
  }

  getWeeklyTrend(): Observable<WeeklyTrend> {
    return this.http.get<WeeklyTrend>(`${this.apiUrl}/weekly-trend/`);
  }

  getRecentStudies(): Observable<RecentStudy[]> {
    return this.http.get<RecentStudy[]>(`${this.apiUrl}/recent-studies/`);
  }

  getRecentReports(): Observable<RecentReport[]> {
    return this.http.get<RecentReport[]>(`${this.apiUrl}/recent-reports/`);
  }
}
