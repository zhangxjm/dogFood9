import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { ReportService } from '../../../services/report.service';
import { ReportTypeOptions } from '../../../models/report.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-report-generate',
  templateUrl: './report-generate.component.html',
  styleUrls: ['./report-generate.component.scss']
})
export class ReportGenerateComponent implements OnInit {
  form: FormGroup;
  studyId!: number;
  reportTypeOptions = ReportTypeOptions;
  loading = false;
  previewMode = false;
  aiLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup({
      studyId: new FormControl('', [Validators.required]),
      reportType: new FormControl('', [Validators.required]),
      findings: new FormControl('', [Validators.required]),
      conclusion: new FormControl('', [Validators.required]),
      recommendations: new FormControl('')
    });
  }

  ngOnInit(): void {
    this.studyId = Number(this.route.snapshot.paramMap.get('studyId'));
    this.form.patchValue({ studyId: this.studyId });
  }

  fillFromAi(): void {
    this.aiLoading = true;
    this.reportService.generateFromAi(this.studyId).subscribe({
      next: (report) => {
        this.form.patchValue({
          reportType: report.reportType,
          findings: report.findings,
          conclusion: report.conclusion,
          recommendations: report.recommendations
        });
        this.aiLoading = false;
        this.snackBar.open('AI自动填充完成', '关闭', { duration: 3000 });
      },
      error: () => {
        this.aiLoading = false;
        this.snackBar.open('AI填充失败', '关闭', { duration: 3000 });
      }
    });
  }

  togglePreview(): void {
    this.previewMode = !this.previewMode;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.reportService.createReport(this.form.value).subscribe({
      next: (report) => {
        this.snackBar.open('报告创建成功', '关闭', { duration: 3000 });
        this.router.navigate(['/reports', report.id]);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/studies', this.studyId]);
  }
}

@NgModule({
  declarations: [ReportGenerateComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModules],
  exports: [ReportGenerateComponent]
})
export class ReportGenerateModule {}
