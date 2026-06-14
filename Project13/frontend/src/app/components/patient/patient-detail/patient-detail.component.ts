import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModules } from '../../../shared/material.module';
import { PatientService } from '../../../services/patient.service';
import { StudyService } from '../../../services/study.service';
import { ReportService } from '../../../services/report.service';
import { Patient, GenderLabels } from '../../../models/patient.model';
import { Study, StudyStatus, StudyStatusLabels } from '../../../models/study.model';
import { Report, ReportStatus, ReportStatusLabels } from '../../../models/report.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss']
})
export class PatientDetailComponent implements OnInit {
  patient: Patient | null = null;
  studies: Study[] = [];
  reports: Report[] = [];
  selectedTab = 0;
  genderLabels = GenderLabels;
  studyStatusLabels = StudyStatusLabels;
  reportStatusLabels = ReportStatusLabels;
  displayedStudyColumns = ['studyDate', 'studyType', 'bodyPart', 'status'];
  displayedReportColumns = ['reportType', 'conclusion', 'status', 'createdAt'];

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private studyService: StudyService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPatient(id);
    this.loadStudies(id);
    this.loadReports(id);
  }

  loadPatient(id: number): void {
    this.patientService.getPatient(id).subscribe(data => this.patient = data);
  }

  loadStudies(patientId: number): void {
    this.studyService.getStudiesByPatient(patientId).subscribe(data => this.studies = data);
  }

  loadReports(patientId: number): void {
    this.reportService.getReportsByPatient(patientId).subscribe(data => this.reports = data);
  }

  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'analyzing': return 'status-processing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  getStudyStatusLabel(status: string): string {
    return this.studyStatusLabels[status as StudyStatus] || status;
  }

  getReportStatusLabel(status: string): string {
    return this.reportStatusLabels[status as ReportStatus] || status;
  }
}

@NgModule({
  declarations: [PatientDetailComponent],
  imports: [CommonModule, MaterialModules],
  exports: [PatientDetailComponent]
})
export class PatientDetailModule {}
