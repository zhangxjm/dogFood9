import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { ConsultationService } from '../../../services/consultation.service';
import { Consultation, ConsultationStatus, ConsultationStatusLabels, ConsultationComment } from '../../../models/consultation.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-consultation-detail',
  templateUrl: './consultation-detail.component.html',
  styleUrls: ['./consultation-detail.component.scss']
})
export class ConsultationDetailComponent implements OnInit {
  consultation: Consultation | null = null;
  consultationStatusLabels = ConsultationStatusLabels;
  commentContent = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadConsultation(id);
  }

  loadConsultation(id: number): void {
    this.consultationService.getConsultation(id).subscribe(data => this.consultation = data);
  }

  addComment(): void {
    if (!this.consultation || !this.commentContent.trim()) return;
    this.loading = true;
    this.consultationService.addComment(this.consultation.id, this.commentContent).subscribe({
      next: () => {
        this.commentContent = '';
        this.loading = false;
        this.loadConsultation(this.consultation!.id);
        this.snackBar.open('评论已发送', '关闭', { duration: 2000 });
      },
      error: () => { this.loading = false; }
    });
  }

  closeConsultation(): void {
    if (!this.consultation) return;
    this.consultationService.closeConsultation(this.consultation.id).subscribe({
      next: () => {
        this.snackBar.open('会诊已关闭', '关闭', { duration: 3000 });
        this.loadConsultation(this.consultation!.id);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/consultations']);
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
  declarations: [ConsultationDetailComponent],
  imports: [CommonModule, FormsModule, MaterialModules],
  exports: [ConsultationDetailComponent]
})
export class ConsultationDetailModule {}
