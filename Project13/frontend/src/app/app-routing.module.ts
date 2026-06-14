import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { AuthGuard } from './services/auth.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PatientListComponent } from './components/patient/patient-list/patient-list.component';
import { PatientDetailComponent } from './components/patient/patient-detail/patient-detail.component';
import { StudyListComponent } from './components/study/study-list/study-list.component';
import { StudyDetailComponent } from './components/study/study-detail/study-detail.component';
import { NoduleListComponent } from './components/nodule/nodule-list/nodule-list.component';
import { NoduleDetailComponent } from './components/nodule/nodule-detail/nodule-detail.component';
import { ReportListComponent } from './components/report/report-list/report-list.component';
import { ReportDetailComponent } from './components/report/report-detail/report-detail.component';
import { ReportGenerateComponent } from './components/report/report-generate/report-generate.component';
import { ConsultationListComponent } from './components/consultation/consultation-list/consultation-list.component';
import { ConsultationDetailComponent } from './components/consultation/consultation-detail/consultation-detail.component';
import { ConsultationFormComponent } from './components/consultation/consultation-form/consultation-form.component';
import { CaseComparisonComponent } from './components/comparison/case-comparison/case-comparison.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientListComponent },
      { path: 'patients/:id', component: PatientDetailComponent },
      { path: 'studies', component: StudyListComponent },
      { path: 'studies/:id', component: StudyDetailComponent },
      { path: 'nodules', component: NoduleListComponent },
      { path: 'nodules/:id', component: NoduleDetailComponent },
      { path: 'reports', component: ReportListComponent },
      { path: 'reports/:id', component: ReportDetailComponent },
      { path: 'reports/generate/:studyId', component: ReportGenerateComponent },
      { path: 'consultations', component: ConsultationListComponent },
      { path: 'consultations/new', component: ConsultationFormComponent },
      { path: 'consultations/:id', component: ConsultationDetailComponent },
      { path: 'comparison', component: CaseComparisonComponent },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
