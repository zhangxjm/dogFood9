import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { StudyService } from '../../../services/study.service';
import { StudyTypeOptions, BodyPartOptions } from '../../../models/study.model';

@Component({
  selector: 'app-study-upload',
  templateUrl: './study-upload.component.html',
  styleUrls: ['./study-upload.component.scss']
})
export class StudyUploadComponent {
  form: FormGroup;
  files: File[] = [];
  dragOver = false;
  uploading = false;
  uploadProgress = 0;
  studyTypeOptions = StudyTypeOptions;
  bodyPartOptions = BodyPartOptions;

  constructor(
    private dialogRef: MatDialogRef<StudyUploadComponent>,
    private studyService: StudyService
  ) {
    this.form = new FormGroup({
      patientId: new FormControl('', [Validators.required]),
      studyType: new FormControl('', [Validators.required]),
      bodyPart: new FormControl('', [Validators.required]),
      description: new FormControl('')
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
    }
  }

  addFiles(fileList: FileList): void {
    for (let i = 0; i < fileList.length; i++) {
      this.files.push(fileList[i]);
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  onSubmit(): void {
    if (this.form.invalid || this.files.length === 0) return;
    this.uploading = true;

    this.studyService.createStudy(this.form.value).subscribe({
      next: (study) => {
        this.studyService.uploadDicom(study.id, this.files).subscribe({
          next: () => {
            this.uploadProgress = 100;
            this.dialogRef.close(true);
          },
          error: () => {
            this.uploading = false;
          }
        });
      },
      error: () => {
        this.uploading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
