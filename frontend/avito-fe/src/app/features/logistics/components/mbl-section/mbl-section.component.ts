import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewDraft, MblReview } from '../../../../core/models/schemas';
import { DocumentModalComponent } from '../../../../shared/components/document-modal/document-modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { BackendApiService } from '../../../../core/services/backend-api.service';
import { base64PdfToObjectUrl, revokeObjectUrl } from '../../../../shared/utils/document-preview';

@Component({
  selector: 'app-mbl-section',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentModalComponent],
  templateUrl: './mbl-section.component.html',
  styleUrls: ['./mbl-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MblSectionComponent {
  @Input() reviews!: ReviewDraft[];
  @Input() mblReview!: MblReview;
  @Input() batchId!: string;
  @Output() generateRequested = new EventEmitter<void>();

  viewMbl = false;
  previewMblUrl: string | null = null;
  isPreviewing = false;

  private toast = inject(ToastService);
  private backendService = inject(BackendApiService);
  private cdr = inject(ChangeDetectorRef);

  getIncludedHblNumbers(): string {
    const hblNumbers = this.reviews.map(r => r.hbl_number).filter(n => !!n);
    return Array.from(new Set(hblNumbers)).join(', ');
  }

  previewMbl() {
    if (!this.batchId) {
      this.toast.show('Missing batch ID for preview.', 'error');
      return;
    }
    this.isPreviewing = true;
    this.cdr.markForCheck();
    this.backendService.previewMbl(this.batchId, this.mblReview.mbl_details).subscribe({
      next: (response) => {
        this.previewMblUrl = base64PdfToObjectUrl(response.base64);
        this.viewMbl = true;
        this.isPreviewing = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        const errorDetail = error?.error?.detail;
        const msg = typeof errorDetail === 'string'
          ? errorDetail
          : (Array.isArray(errorDetail) ? errorDetail.map((e: any) => e.msg).join(', ') : 'Failed to preview MBL. Please try again.');
        this.toast.show(msg, 'error');
        this.isPreviewing = false;
        this.cdr.markForCheck();
        console.error('MBL preview error:', error);
      }
    });
  }

  onMblModalClose() {
    this.viewMbl = false;
    if (this.previewMblUrl) {
      revokeObjectUrl(this.previewMblUrl);
      this.previewMblUrl = null;
    }
    this.cdr.markForCheck();
  }

  saveDetails(form: any) {
    if (form.invalid) {
      this.toast.show('Please complete all required MBL fields.', 'error');
      return;
    }
    this.mblReview.details_confirmed = true;
    this.generateRequested.emit();
  }
}
