import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MaterialModules } from '../../shared/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgChartsModule } from 'ng2-charts';
import { DashboardService, DashboardStats, WeeklyTrend, RecentStudy, RecentReport } from '../../services/dashboard.service';
import { StudyStatus, StudyStatusLabels } from '../../models/study.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = { todayExams: 0, pendingAnalysis: 0, pendingReports: 0, pendingConsultations: 0 };
  recentStudies: RecentStudy[] = [];
  recentReports: RecentReport[] = [];
  weeklyChartData: any;
  weeklyChartOptions: any;
  studyStatusLabels = StudyStatusLabels;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadWeeklyTrend();
    this.loadRecentStudies();
    this.loadRecentReports();
  }

  loadStats(): void {
    this.dashboardService.getStats().subscribe(data => this.stats = data);
  }

  loadWeeklyTrend(): void {
    this.dashboardService.getWeeklyTrend().subscribe(data => {
      this.weeklyChartData = {
        labels: data.labels,
        datasets: [{
          label: '检查数量',
          data: data.data,
          backgroundColor: 'rgba(25, 118, 210, 0.7)',
          borderColor: '#1976D2',
          borderWidth: 1,
          borderRadius: 4
        }]
      };
    });
    this.weeklyChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    };
  }

  loadRecentStudies(): void {
    this.dashboardService.getRecentStudies().subscribe(data => this.recentStudies = data);
  }

  loadRecentReports(): void {
    this.dashboardService.getRecentReports().subscribe(data => this.recentReports = data);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'analyzing': return 'status-processing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  getReportStatusClass(status: string): string {
    switch (status) {
      case 'unsigned': return 'status-unsigned';
      case 'signed': return 'status-signed';
      default: return '';
    }
  }

  getStudyStatusLabel(status: string): string {
    return this.studyStatusLabels[status as StudyStatus] || status;
  }
}

const routes: Routes = [
  { path: '', component: DashboardComponent }
];

@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MaterialModules, FlexLayoutModule, NgChartsModule],
  exports: [DashboardComponent]
})
export class DashboardModule {}
