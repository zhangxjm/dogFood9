import { NgModule, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { MaterialModules } from '../../../shared/material.module';
import { NoduleService } from '../../../services/nodule.service';
import { Nodule, MalignancyLevelLabels, MalignancyLevelCssClass, DetectionMethodLabels } from '../../../models/nodule.model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-nodule-detail',
  templateUrl: './nodule-detail.component.html',
  styleUrls: ['./nodule-detail.component.scss']
})
export class NoduleDetailComponent implements OnInit {
  nodule: Nodule | null = null;
  malignancyLevelLabels = MalignancyLevelLabels;
  malignancyLevelCssClass = MalignancyLevelCssClass;
  detectionMethodLabels = DetectionMethodLabels;
  gaugeData: any;
  gaugeOptions: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private noduleService: NoduleService
  ) {
    this.gaugeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      rotation: -90,
      circumference: 180,
      scales: {
        y: {
          min: 0,
          max: 100,
          display: false
        }
      }
    };
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.noduleService.getNodule(id).subscribe(data => {
      this.nodule = data;
      this.updateGaugeChart(data.malignancyProbability);
    });
  }

  private updateGaugeChart(probability: number): void {
    const pct = probability * 100;
    let color = '#4CAF50';
    if (pct > 80) color = '#F44336';
    else if (pct > 60) color = '#FF9800';
    else if (pct > 40) color = '#FFC107';

    this.gaugeData = {
      labels: ['恶性概率'],
      datasets: [{
        data: [pct, 100 - pct],
        backgroundColor: [color, '#e0e0e0'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      }]
    };
  }

  goBack(): void {
    this.router.navigate(['/nodules']);
  }
}

@NgModule({
  declarations: [NoduleDetailComponent],
  imports: [CommonModule, MaterialModules, NgChartsModule],
  exports: [NoduleDetailComponent]
})
export class NoduleDetailModule {}
