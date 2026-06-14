import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, ConsultationStatus, ConsultationStatusLabels } from '../../../models/consultation.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-consultation-list',
  templateUrl: './consultation-list.component.html',
  styleUrls: ['./consultation-list.component.scss']
})
export class ConsultationListComponent implements OnInit {
  displayedColumns: string[] = ['title', 'initiatorName', 'status', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Consultation>([]);
  total = 0;
  statusFilter: ConsultationStatus | '' = '';
  consultationStatusLabels = ConsultationStatusLabels;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private consultationService: ConsultationService, private router: Router) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;
    this.consultationService.getConsultations({
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
    this.loadConsultations();
  }

  onPageChange(): void {
    this.loadConsultations();
  }

  viewConsultation(id: number): void {
    this.router.navigate(['/consultations', id]);
  }

  createConsultation(): void {
    this.router.navigate(['/consultations/new']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-processing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    return this.consultationStatusLabels[status as ConsultationStatus] || status;
  }
}

@NgModule({
  declarations: [ConsultationListComponent],
  imports: [CommonModule, FormsModule, MaterialModules],
  exports: [ConsultationListComponent]
})
export class ConsultationListModule {}
