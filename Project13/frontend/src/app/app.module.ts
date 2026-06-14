import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardModule } from './components/dashboard/dashboard.component';
import { PatientListModule } from './components/patient/patient-list/patient-list.component';
import { PatientDetailModule } from './components/patient/patient-detail/patient-detail.component';
import { PatientFormComponent } from './components/patient/patient-form/patient-form.component';
import { StudyListModule } from './components/study/study-list/study-list.component';
import { StudyDetailModule } from './components/study/study-detail/study-detail.component';
import { StudyUploadComponent } from './components/study/study-upload/study-upload.component';
import { DicomViewerModule } from './components/viewer/dicom-viewer/dicom-viewer.component';
import { NoduleListModule } from './components/nodule/nodule-list/nodule-list.component';
import { NoduleDetailModule } from './components/nodule/nodule-detail/nodule-detail.component';
import { ReportListModule } from './components/report/report-list/report-list.component';
import { ReportDetailModule } from './components/report/report-detail/report-detail.component';
import { ReportGenerateModule } from './components/report/report-generate/report-generate.component';
import { ConsultationListModule } from './components/consultation/consultation-list/consultation-list.component';
import { ConsultationDetailModule } from './components/consultation/consultation-detail/consultation-detail.component';
import { ConsultationFormModule } from './components/consultation/consultation-form/consultation-form.component';
import { CaseComparisonModule } from './components/comparison/case-comparison/case-comparison.component';
import { MaterialModules } from './shared/material.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LayoutComponent,
    PatientFormComponent,
    StudyUploadComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    AppRoutingModule,
    MaterialModules,
    DashboardModule,
    PatientListModule,
    PatientDetailModule,
    StudyListModule,
    StudyDetailModule,
    DicomViewerModule,
    NoduleListModule,
    NoduleDetailModule,
    ReportListModule,
    ReportDetailModule,
    ReportGenerateModule,
    ConsultationListModule,
    ConsultationDetailModule,
    ConsultationFormModule,
    CaseComparisonModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
