import { NgModule, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModules } from '../../../shared/material.module';
import { NoduleService } from '../../../services/nodule.service';
import { Nodule, MalignancyLevel, MalignancyLevelLabels, MalignancyLevelCssClass, DetectionMethod, DetectionMethodLabels } from '../../../models/nodule.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nodule-list',
  templateUrl: './nodule-list.component.html',
  styleUrls: ['./nodule-list.component.scss']
})
export class NoduleListComponent implements OnInit {
  displayedColumns: string[] = ['studyId', 'noduleType', 'size', 'malignancyProbability', 'malignancyLevel', 'detectionMethod', 'actions'];
  dataSource = new MatTableDataSource<Nodule>([]);
  total = 0;
  malignancyFilter: MalignancyLevel | '' = '';
  malignancyLevelLabels = MalignancyLevelLabels;
  malignancyLevelCssClass = MalignancyLevelCssClass;
  detectionMethodLabels = DetectionMethodLabels;
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private noduleService: NoduleService, private router: Router) {}

  ngOnInit(): void {
    this.loadNodules();
  }

  loadNodules(): void {
    this.loading = true;
    this.noduleService.getNodules({
      malignancyLevel: this.malignancyFilter || undefined,
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

  onFilterChange(): void {
    if (this.paginator) this.paginator.firstPage();
    this.loadNodules();
  }

  onPageChange(): void {
    this.loadNodules();
  }

  viewNodule(id: number): void {
    this.router.navigate(['/nodules', id]);
  }

  getMalignancyLabel(level: string): string {
    return this.malignancyLevelLabels[level as MalignancyLevel] || level;
  }

  getMalignancyCssClass(level: string): string {
    return this.malignancyLevelCssClass[level as MalignancyLevel] || '';
  }

  getDetectionMethodLabel(method: string): string {
    return this.detectionMethodLabels[method as DetectionMethod] || method;
  }
}

@NgModule({
  declarations: [NoduleListComponent],
  imports: [CommonModule, FormsModule, MaterialModules],
  exports: [NoduleListComponent]
})
export class NoduleListModule {}
