import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModules } from '../../../shared/material.module';
import { ReportService } from '../../../services/report.service';
import { Report, ReportStatusLabels } from '../../../models/report.model';
import { MalignancyLevel, MalignancyLevelLabels, MalignancyLevelCssClass } from '../../../models/nodule.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-report-detail',
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss']
})
export class ReportDetailComponent implements OnInit {
  report: Report | null = null;
  reportStatusLabels = ReportStatusLabels;
  malignancyLevelLabels = MalignancyLevelLabels;
  malignancyLevelCssClass = MalignancyLevelCssClass;
  displayedNoduleColumns = ['noduleType', 'size', 'malignancyLevel', 'malignancyProbability', 'description'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.reportService.getReport(id).subscribe(data => this.report = data);
  }

  signReport(): void {
    if (!this.report) return;
    this.reportService.signReport(this.report.id).subscribe({
      next: () => {
        this.snackBar.open('报告签署成功', '关闭', { duration: 3000 });
        this.report!.status = 'signed';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }

  getMalignancyLabel(level: string): string {
    return this.malignancyLevelLabels[level as MalignancyLevel] || level;
  }

  getMalignancyCssClass(level: string): string {
    return this.malignancyLevelCssClass[level as MalignancyLevel] || 'uncertain';
  }
}

@NgModule({
  declarations: [ReportDetailComponent],
  imports: [CommonModule, MaterialModules],
  exports: [ReportDetailComponent]
})
export class ReportDetailModule {}
