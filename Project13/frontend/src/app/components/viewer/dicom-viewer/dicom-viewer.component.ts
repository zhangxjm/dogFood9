import { NgModule, Component, OnInit, AfterViewInit, OnDestroy, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModules } from '../../../shared/material.module';
import { Nodule, MalignancyLevelLabels, MalignancyLevelCssClass } from '../../../models/nodule.model';

declare var cornerstone: any;
declare var cornerstoneTools: any;
declare var cornerstoneWADOImageLoader: any;

@Component({
  selector: 'app-dicom-viewer',
  templateUrl: './dicom-viewer.component.html',
  styleUrls: ['./dicom-viewer.component.scss']
})
export class DicomViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() studyId!: number;
  @Input() nodules: Nodule[] = [];

  @ViewChild('dicomCanvas') dicomCanvas!: ElementRef;

  activeTool = '';
  selectedNodule: Nodule | null = null;
  malignancyLevelLabels = MalignancyLevelLabels;
  malignancyLevelCssClass = MalignancyLevelCssClass;
  private element: any;

  tools = [
    { name: 'wwwc', label: '窗宽窗位', icon: 'tonality' },
    { name: 'zoom', label: '缩放', icon: 'zoom_in' },
    { name: 'pan', label: '平移', icon: 'pan_tool' },
    { name: 'length', label: '长度测量', icon: 'straighten' },
    { name: 'angle', label: '角度测量', icon: 'change_history' },
    { name: 'rectangleRoi', label: '矩形标注', icon: 'crop_square' },
    { name: 'ellipticalRoi', label: '椭圆标注', icon: 'radio_button_unchecked' },
    { name: 'arrowAnnotate', label: '箭头标注', icon: 'north_east' }
  ];

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initCornerstone();
  }

  ngOnDestroy(): void {
    try {
      if (this.element) {
        cornerstone.disable(this.element);
      }
    } catch {}
  }

  private initCornerstone(): void {
    try {
      this.element = this.dicomCanvas?.nativeElement;
      if (!this.element) return;

      cornerstone.enable(this.element);

      cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
      cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
      cornerstoneTools.addTool(cornerstoneTools.PanTool);
      cornerstoneTools.addTool(cornerstoneTools.LengthTool);
      cornerstoneTools.addTool(cornerstoneTools.AngleTool);
      cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);
      cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);
      cornerstoneTools.addTool(cornerstoneTools.ArrowAnnotateTool);

      this.loadDemoImage();
    } catch (e) {
      console.error('Cornerstone initialization error:', e);
    }
  }

  private loadDemoImage(): void {
    try {
      if (!this.element) return;
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(1, '#111');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DICOM影像预览区', 256, 256);
        ctx.fillText(`Study ID: ${this.studyId}`, 256, 280);
      }
      const imageId = cornerstone.createImageId?.(canvas) || '';
      if (imageId) {
        cornerstone.loadImage(imageId).then((image: any) => {
          cornerstone.displayImage(this.element, image);
        });
      }
    } catch {}
  }

  activateTool(toolName: string): void {
    try {
      if (!this.element) return;
      cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
      this.tools.forEach(t => {
        if (t.name !== toolName) {
          cornerstoneTools.setToolPassive(t.name);
        }
      });
      this.activeTool = toolName;
    } catch {}
  }

  undo(): void {
    try {
      cornerstoneTools.undo(this.element);
    } catch {}
  }

  clearAnnotations(): void {
    try {
      cornerstoneTools.clearToolState(this.element, 'length');
      cornerstoneTools.clearToolState(this.element, 'angle');
      cornerstoneTools.clearToolState(this.element, 'rectangleRoi');
      cornerstoneTools.clearToolState(this.element, 'ellipticalRoi');
      cornerstoneTools.clearToolState(this.element, 'arrowAnnotate');
      cornerstone.update(this.element);
    } catch {}
  }

  resetViewport(): void {
    try {
      cornerstone.reset(this.element);
    } catch {}
  }

  selectNodule(nodule: Nodule): void {
    this.selectedNodule = nodule;
  }

  getMalignancyPercent(prob: number): string {
    return (prob * 100).toFixed(1) + '%';
  }
}

@NgModule({
  declarations: [DicomViewerComponent],
  imports: [CommonModule, MaterialModules],
  exports: [DicomViewerComponent]
})
export class DicomViewerModule {}
