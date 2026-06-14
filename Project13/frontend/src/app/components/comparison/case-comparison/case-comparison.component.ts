import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { StudyService } from '../../../services/study.service';
import { NoduleService } from '../../../services/nodule.service';
import { Study, StudyStatus, StudyStatusLabels } from '../../../models/study.model';
import { Nodule, MalignancyLevel, MalignancyLevelLabels, MalignancyLevelCssClass } from '../../../models/nodule.model';
import { DicomViewerModule } from '../../viewer/dicom-viewer/dicom-viewer.component';

@Component({
  selector: 'app-case-comparison',
  templateUrl: './case-comparison.component.html',
  styleUrls: ['./case-comparison.component.scss']
})
export class CaseComparisonComponent implements OnInit {
  studies: Study[] = [];
  selectedStudyA: number | null = null;
  selectedStudyB: number | null = null;
  studyA: Study | null = null;
  studyB: Study | null = null;
  nodulesA: Nodule[] = [];
  nodulesB: Nodule[] = [];
  studyStatusLabels = StudyStatusLabels;
  malignancyLevelLabels = MalignancyLevelLabels;
  malignancyLevelCssClass = MalignancyLevelCssClass;
  displayedColumns = ['property', 'studyA', 'studyB'];

  constructor(
    private studyService: StudyService,
    private noduleService: NoduleService
  ) {}

  ngOnInit(): void {
    this.studyService.getStudies({ pageSize: 100 }).subscribe(res => this.studies = res.data);
  }

  onStudyAChange(): void {
    if (!this.selectedStudyA) { this.studyA = null; this.nodulesA = []; return; }
    this.studyService.getStudy(this.selectedStudyA).subscribe(data => this.studyA = data);
    this.noduleService.getNodulesByStudy(this.selectedStudyA).subscribe(data => this.nodulesA = data);
  }

  onStudyBChange(): void {
    if (!this.selectedStudyB) { this.studyB = null; this.nodulesB = []; return; }
    this.studyService.getStudy(this.selectedStudyB).subscribe(data => this.studyB = data);
    this.noduleService.getNodulesByStudy(this.selectedStudyB).subscribe(data => this.nodulesB = data);
  }

  getComparisonData(): { property: string; studyA: string; studyB: string }[] {
    if (!this.studyA || !this.studyB) return [];
    return [
      { property: '患者姓名', studyA: this.studyA.patientName, studyB: this.studyB.patientName },
      { property: '检查日期', studyA: this.studyA.studyDate, studyB: this.studyB.studyDate },
      { property: '检查类型', studyA: this.studyA.studyType, studyB: this.studyB.studyType },
      { property: '检查部位', studyA: this.studyA.bodyPart, studyB: this.studyB.bodyPart },
      { property: '状态', studyA: this.studyStatusLabels[this.studyA.status as StudyStatus], studyB: this.studyStatusLabels[this.studyB.status as StudyStatus] },
      { property: '结节数量', studyA: this.nodulesA.length.toString(), studyB: this.nodulesB.length.toString() }
    ];
  }

  getMalignancyLabel(level: string): string {
    return this.malignancyLevelLabels[level as MalignancyLevel] || level;
  }

  getMalignancyCssClass(level: string): string {
    return this.malignancyLevelCssClass[level as MalignancyLevel] || '';
  }
}

@NgModule({
  declarations: [CaseComparisonComponent],
  imports: [CommonModule, FormsModule, MaterialModules, DicomViewerModule],
  exports: [CaseComparisonComponent]
})
export class CaseComparisonModule {}
