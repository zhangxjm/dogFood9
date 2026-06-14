import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { StudyService } from '../../../services/study.service';
import { Study, StudyStatus, StudyStatusLabels } from '../../../models/study.model';
import { MatDialog } from '@angular/material/dialog';
import { StudyUploadComponent } from '../study-upload/study-upload.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-study-list',
  templateUrl: './study-list.component.html',
  styleUrls: ['./study-list.component.scss']
})
export class StudyListComponent implements OnInit {
  displayedColumns: string[] = ['patientName', 'studyDate', 'studyType', 'bodyPart', 'status', 'actions'];
  dataSource = new MatTableDataSource<Study>([]);
  total = 0;
  keyword = '';
  statusFilter: StudyStatus | '' = '';
  studyStatusLabels = StudyStatusLabels;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private studyService: StudyService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStudies();
  }

  loadStudies(): void {
    this.loading = true;
    this.studyService.getStudies({
      keyword: this.keyword || undefined,
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

  onSearch(): void {
    if (this.paginator) this.paginator.firstPage();
    this.loadStudies();
  }

  onPageChange(): void {
    this.loadStudies();
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(StudyUploadComponent, {
      width: '600px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadStudies();
    });
  }

  viewStudy(id: number): void {
    this.router.navigate(['/studies', id]);
  }

  analyzeStudy(id: number): void {
    this.studyService.analyzeStudy(id).subscribe({
      next: () => {
        this.snackBar.open('AI分析已启动', '关闭', { duration: 3000 });
        this.loadStudies();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'analyzing': return 'status-processing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    return this.studyStatusLabels[status as StudyStatus] || status;
  }
}

@NgModule({
  declarations: [StudyListComponent],
  imports: [CommonModule, FormsModule, MaterialModules],
  exports: [StudyListComponent]
})
export class StudyListModule {}
