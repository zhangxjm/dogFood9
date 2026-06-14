import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { ConsultationService } from '../../../services/consultation.service';
import { StudyService } from '../../../services/study.service';
import { Study } from '../../../models/study.model';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss']
})
export class ConsultationFormComponent implements OnInit {
  form: FormGroup;
  studies: Study[] = [];
  experts: { id: number; name: string; department: string; title: string }[] = [];
  loading = false;

  constructor(
    private consultationService: ConsultationService,
    private studyService: StudyService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup({
      title: new FormControl('', [Validators.required]),
      studyId: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
      expertIds: new FormControl([], [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadStudies();
    this.loadExperts();
  }

  loadStudies(): void {
    this.studyService.getStudies({ pageSize: 100 }).subscribe(res => this.studies = res.data);
  }

  loadExperts(): void {
    this.consultationService.getExperts().subscribe(data => this.experts = data);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.consultationService.createConsultation(this.form.value).subscribe({
      next: (consultation) => {
        this.snackBar.open('会诊创建成功', '关闭', { duration: 3000 });
        this.router.navigate(['/consultations', consultation.id]);
      },
      error: () => { this.loading = false; }
    });
  }

  goBack(): void {
    this.router.navigate(['/consultations']);
  }
}

@NgModule({
  declarations: [ConsultationFormComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModules],
  exports: [ConsultationFormComponent]
})
export class ConsultationFormModule {}
