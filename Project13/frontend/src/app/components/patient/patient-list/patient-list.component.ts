import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { PatientService } from '../../../services/patient.service';
import { Patient, GenderLabels } from '../../../models/patient.model';
import { MatDialog } from '@angular/material/dialog';
import { PatientFormComponent } from '../patient-form/patient-form.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'gender', 'age', 'medicalRecordNumber', 'studyCount', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Patient>([]);
  total = 0;
  keyword = '';
  genderLabels = GenderLabels;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private patientService: PatientService, private dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.patientService.getPatients({
      keyword: this.keyword,
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
    this.loadPatients();
  }

  onPageChange(): void {
    this.loadPatients();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(PatientFormComponent, {
      width: '600px',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadPatients();
    });
  }

  openEditDialog(patient: Patient): void {
    const dialogRef = this.dialog.open(PatientFormComponent, {
      width: '600px',
      data: patient
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadPatients();
    });
  }

  viewPatient(id: number): void {
    this.router.navigate(['/patients', id]);
  }

  deletePatient(id: number): void {
    this.patientService.deletePatient(id).subscribe(() => {
      this.loadPatients();
    });
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

  getGenderLabel(gender: string): string {
    return this.genderLabels[gender as 'male' | 'female'] || gender;
  }
}

@NgModule({
  declarations: [PatientListComponent],
  imports: [CommonModule, FormsModule, MaterialModules],
  exports: [PatientListComponent]
})
export class PatientListModule {}
