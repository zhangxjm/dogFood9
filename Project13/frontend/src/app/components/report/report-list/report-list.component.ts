import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { ReportService } from '../../../services/report.service';
import { Report, ReportStatus, ReportStatusLabels } from '../../../models/report.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit {
  displayedColumns: string[] = ['patientName', 'reportType', 'conclusion', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Report>([]);
  total = 0;
  statusFilter: ReportStatus | '' = '';
  reportStatusLabels = ReportStatusLabels;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private reportService: ReportService, private router: Router) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.reportService.getReports({
      status: this.statusFilter || undefined,
      page: this.paginator?.pageIndex ? this.paginator.pageIndex + 1 : 1,
      pageSize: this.paginator?.pageSize || 10
    }).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onFilterChange(): void {
    if (this.paginator) this.paginator.firstPage();
    this.loadReports();
  }

  onPageChange(): void {
    this.loadReports();
  }

  viewReport(id: number): void {
    this.router.navigate(['/reports', id]);
  }

  getStatusLabel(status: string): string {
    return this.reportStatusLabels[status as ReportStatus] || status;
  }
}

@NgModule({
  declarations: [ReportListComponent],
  imports: [CommonModule, FormsModule, MaterialModules],
  exports: [ReportListComponent]
})
export class ReportListModule {}
