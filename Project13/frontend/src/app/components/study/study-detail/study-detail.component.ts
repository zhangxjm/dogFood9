import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModules } from '../../../shared/material.module';
import { StudyService } from '../../../services/study.service';
import { NoduleService } from '../../../services/nodule.service';
import { Study, StudyStatusLabels } from '../../../models/study.model';
import { Nodule, MalignancyLevel, MalignancyLevelLabels, MalignancyLevelCssClass } from '../../../models/nodule.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DicomViewerModule } from '../../viewer/dicom-viewer/dicom-viewer.component';

@Component({
  selector: 'app-study-detail',
  templateUrl: './study-detail.component.html',
  styleUrls: ['./study-detail.component.scss']
})
export class StudyDetailComponent implements OnInit {
  study: Study | null = null;
  nodules: Nodule[] = [];
  studyStatusLabels = StudyStatusLabels;
  malignancyLevelLabels = MalignancyLevelLabels;
  malignancyLevelCssClass = MalignancyLevelCssClass;
  displayedNoduleColumns = ['noduleType', 'size', 'malignancyProbability', 'malignancyLevel', 'actions'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studyService: StudyService,
    private noduleService: NoduleService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadStudy(id);
    this.loadNodules(id);
  }

  loadStudy(id: number): void {
    this.studyService.getStudy(id).subscribe(data => this.study = data);
  }

  loadNodules(studyId: number): void {
    this.noduleService.getNodulesByStudy(studyId).subscribe(data => this.nodules = data);
  }

  analyzeStudy(): void {
    if (!this.study) return;
    this.studyService.analyzeStudy(this.study.id).subscribe({
      next: () => {
        this.snackBar.open('AI分析已启动', '关闭', { duration: 3000 });
        this.loadStudy(this.study!.id);
        this.loadNodules(this.study!.id);
      }
    });
  }

  generateReport(): void {
    if (!this.study) return;
    this.router.navigate(['/reports/generate', this.study.id]);
  }

  requestConsultation(): void {
    this.router.navigate(['/consultations/new']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'analyzing': return 'status-processing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  viewNodule(nodule: Nodule): void {
    this.router.navigate(['/nodules', nodule.id]);
  }

  getMalignancyLabel(level: string): string {
    return this.malignancyLevelLabels[level as MalignancyLevel] || level;
  }

  getMalignancyCssClass(level: string): string {
    return this.malignancyLevelCssClass[level as MalignancyLevel] || '';
  }
}

@NgModule({
  declarations: [StudyDetailComponent],
  imports: [CommonModule, MaterialModules, DicomViewerModule],
  exports: [StudyDetailComponent]
})
export class StudyDetailModule {}
