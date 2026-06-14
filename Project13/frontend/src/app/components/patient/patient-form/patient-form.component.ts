import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.scss']
})
export class PatientFormComponent {
  form: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    private dialogRef: MatDialogRef<PatientFormComponent>,
    private patientService: PatientService,
    @Inject(MAT_DIALOG_DATA) public data: Patient | null
  ) {
    this.isEdit = !!data;
    this.form = new FormGroup({
      name: new FormControl(data?.name || '', [Validators.required]),
      gender: new FormControl(data?.gender || 'male', [Validators.required]),
      birthDate: new FormControl(data?.birthDate || '', [Validators.required]),
      idNumber: new FormControl(data?.idNumber || ''),
      phone: new FormControl(data?.phone || ''),
      address: new FormControl(data?.address || ''),
      medicalRecordNumber: new FormControl(data?.medicalRecordNumber || '', [Validators.required]),
      allergies: new FormControl(data?.allergies || '')
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const request = this.form.value;

    const obs = this.isEdit && this.data
      ? this.patientService.updatePatient(this.data.id, request)
      : this.patientService.createPatient(request);

    obs.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
