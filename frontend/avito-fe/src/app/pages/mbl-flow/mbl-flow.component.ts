import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { BackendApiService } from '../../core/services/backend-api.service';
import { DocumentExtractionService } from '../../core/services/document-extraction.service';
import { UploaderComponent } from '../../features/logistics/components/uploader/uploader.component';
import { HblDraftComponent } from '../../features/logistics/components/hbl-draft/hbl-draft.component';
import { MblSectionComponent } from '../../features/logistics/components/mbl-section/mbl-section.component';
import { GroupingBoardComponent } from '../../features/logistics/components/grouping-board/grouping-board.component';
import { WifiLoaderComponent } from '../../shared/components/wifi-loader/wifi-loader.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ReviewDraft, BatchExtractionResponse, HblGroup } from '../../core/models/schemas';
import { WorkflowStateService } from '../../core/services/workflow-state.service';

import { DocumentModalComponent } from '../../shared/components/document-modal/document-modal.component';
import { RouterModule } from '@angular/router';
import { finalize, tap } from 'rxjs/operators';
import { base64PdfToObjectUrl, revokeObjectUrl } from '../../shared/utils/document-preview';

@Component({
  selector: 'app-mbl-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    UploaderComponent,
    HblDraftComponent,
    MblSectionComponent,
    GroupingBoardComponent,
    WifiLoaderComponent,
    DocumentModalComponent
  ],
  templateUrl: './mbl-flow.component.html',
  styleUrls: ['./mbl-flow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MblFlowComponent {
  workflow = inject(WorkflowStateService);

  isExtracting = signal<boolean>(false);
  isGenerating = signal<boolean>(false);
  
  selectedDocUrl = signal<string | null>(null);
  selectedDocName = signal<string>('');
  selectedDocMime = signal<string>('');

  constructor(
    private toast: ToastService,
    private backendService: BackendApiService,
    private extractionService: DocumentExtractionService
  ) {}

  onPreviewFile(file: File) {
    const url = URL.createObjectURL(file);
    this.selectedDocUrl.set(url);
    this.selectedDocName.set(file.name);
    this.selectedDocMime.set(file.type || 'application/pdf');
  }

  viewDoc(draft: ReviewDraft) {
    this.selectedDocUrl.set(draft.source_document || null);
    this.selectedDocName.set(draft.source_name);
    this.selectedDocMime.set(draft.mime_type || 'application/pdf');
  }

  closeDoc() {
    this.selectedDocUrl.set(null);
  }

  processFiles(files: File[]) {
    const existingNames = new Set(this.workflow.hblReviews().map(r => r.source_name));
    const newFiles = files.filter(f => !existingNames.has(f.name));

    if (newFiles.length === 0) {
      this.toast.show('All selected files have already been extracted.', 'info');
      return;
    }

    this.isExtracting.set(true);
    
    const existingBatchId = this.workflow.hblReviews()[0]?.batch_id;
    this.backendService.uploadFiles(newFiles, undefined, existingBatchId).pipe(
      tap(response => this.applyExtractionResponse(response, newFiles, existingBatchId)),
      finalize(() => this.isExtracting.set(false))
    ).subscribe({
      next: (response: BatchExtractionResponse) => {
        this.toast.show(`Extracted data from ${newFiles.length} files successfully`, 'success');
        this.workflow.setCurrentStep(1);
      },
      error: (error) => {
        const errorDetail = error?.error?.detail;
        const msg = typeof errorDetail === 'string'
          ? errorDetail
          : (Array.isArray(errorDetail) ? errorDetail.map((e: any) => e.msg).join(', ') : 'Failed to extract data from files. Please try again.');
        this.toast.show(msg, 'error');
        console.error('Extraction error:', error);
      }
    });
  }

  private applyExtractionResponse(
    response: BatchExtractionResponse,
    newFiles: File[],
    existingBatchId?: string
  ) {
    let currentColors = { ...this.workflow.groupColors() };
    this.workflow.applyBatchGroups(
      response.batch_id,
      response.hbl_groups,
      response.documents.map(document => document.document_id)
    );
    if (existingBatchId) {
      this.workflow.setMblReview(null);
    }
    const currentDrafts = [...this.workflow.hblReviews()];

    response.hbl_groups.forEach(group => {
      const groupItems = response.documents.filter(doc => group.document_ids.includes(doc.document_id));
      // Every group the backend returns is a real HBL group, including single-document
      // ones. Register a colour for each so the group renders as grouped rather than
      // falling through to the ungrouped drop zone.
      if (!currentColors[group.group_id]) {
        const colorIndex = Object.keys(currentColors).length % this.workflow.availableColors.length;
        currentColors[group.group_id] = this.workflow.availableColors[colorIndex];
      }
      this.workflow.addServerGroupIds([group.group_id]);

      groupItems.forEach(item => {
        const file = newFiles.find(f => f.name === item.filename);
        if (!file) return;

        const newDraft: ReviewDraft = {
          draft_id: Math.random().toString(36).substring(7),
          source_name: file.name,
          source_document: URL.createObjectURL(file),
          mime_type: file.type || 'application/pdf',
          group_id: group.group_id,
          batch_id: response.batch_id,
          document_id: item.document_id,
          packing_list: item.extraction,
          group_packing_list: group.combined_extraction,
          details_confirmed: false,
          hbl_details: {
            hbl_number: item.extraction?.packing_list_number ? 'HBL-' + item.extraction.packing_list_number.replace('PL-', '') : null,
            notify_party: JSON.parse(JSON.stringify(item.extraction?.notify_party || { name: null, address: null, tax_id: null })),
            container_number: item.extraction?.containers?.[0]?.container_number || null,
            seal_number: item.extraction?.containers?.[0]?.seal_numbers?.[0] || null,
            freight_terms: item.extraction?.freight_terms || null
          }
        };
        currentDrafts.push(newDraft);
      });
    });

    this.workflow.setGroupColors(currentColors);
    this.workflow.setHblReviews(currentDrafts);
  }

  generateHbl(drafts: ReviewDraft[]) {
    this.isGenerating.set(true);
    
    const firstDraft = drafts[0];
    if (!firstDraft.batch_id || !firstDraft.group_id) {
      this.toast.show('Missing batch or group ID. Please re-upload files.', 'error');
      this.isGenerating.set(false);
      return;
    }

    this.extractionService.generateHblBase64(firstDraft).subscribe({
      next: (response) => {
        const pdfUrl = base64PdfToObjectUrl(response.base64);
        
        drafts.forEach(draft => {
          this.workflow.updateDraft(draft.draft_id, {
            hbl_pdf: pdfUrl,
            hbl_filename: response.filename,
            hbl_number: firstDraft.hbl_details.hbl_number || undefined
          });
        });
        
        this.toast.show('Final HBL generated. Saved HBL details are locked.', 'success');
        this.isGenerating.set(false);
        this.checkMblReadiness();
      },
      error: (error) => {
        const errorDetail = error?.error?.detail;
        const msg = typeof errorDetail === 'string'
          ? errorDetail
          : (Array.isArray(errorDetail) ? errorDetail.map((e: any) => e.msg).join(', ') : 'Failed to generate HBL. Please try again.');
        this.toast.show(msg, 'error');
        this.isGenerating.set(false);
        console.error('HBL generation error:', error);
      }
    });
  }

  checkMblReadiness() {
    if (this.workflow.canShowMbl()) {
      if (!this.workflow.mblReview()) {
        const drafts = this.workflow.hblReviews();
        const batchId = drafts[0]?.batch_id;
        if (!batchId) {
          this.toast.show('Missing batch ID. Please re-upload files.', 'error');
          return;
        }
        
        const firstPl = drafts[0]?.packing_list;
        const firstVessel = drafts
          .map(draft => draft.packing_list.vessel_name?.trim())
          .find((value): value is string => !!value);
        this.workflow.setMblReview({
          draft_id: Math.random().toString(36).substring(7),
          draft_ids: drafts.map(r => r.draft_id),
          details_confirmed: true,
          mbl_details: {
            mbl_number: 'MSCU' + Math.floor(100000 + Math.random() * 900000),
            pre_carriage_by: this.commonPackingListValue(drafts, 'pre_carriage_by') || 'Truck',
            vessel_name: firstVessel ?? 'MSC BARI',
            voyage_number: this.commonPackingListValue(drafts, 'voyage_or_flight_number') || 'VOY-2401W',
            port_of_loading: this.commonPackingListValue(drafts, 'port_of_loading') || 'Chennai, India (INMAA)',
            port_of_discharge: this.commonPackingListValue(drafts, 'port_of_discharge') || 'Long Beach, CA (USLGB)',
            place_of_final_delivery: this.commonPackingListValue(drafts, 'place_of_final_delivery') || 'Los Angeles, CA',
            tare_weight: '3,800 KGS',
            verified_gross_mass: '14,770 KGS',
            carrier_booking_reference: 'BKG-MSC-992019',
            shipper: firstPl?.shipper_exporter ?? { name: 'ACME EXPORTS PVT LTD', address: 'Chennai, India', tax_id: null },
            consignee: firstPl?.consignee ?? { name: 'GLOBAL LOGISTICS LLC', address: 'Springfield, OR, USA', tax_id: null },
            cargo_description: 'Auto Spare Parts & Assemblies',
            total_packages: '770 Cartons',
            total_gross_weight: '10,970 KGS',
            total_measurement: '53.50 CBM'
          }
        });
      }

    }
  }

  private commonPackingListValue(
    drafts: ReviewDraft[],
    field: 'pre_carriage_by' | 'voyage_or_flight_number' | 'port_of_loading' | 'port_of_discharge' | 'place_of_final_delivery'
  ): string | null {
    const values = drafts
      .map(draft => draft.packing_list[field]?.trim())
      .filter((value): value is string => !!value);
    return values.length > 0 && values.every(value => value.toLowerCase() === values[0].toLowerCase())
      ? values[0]
      : null;
  }

  generateMbl() {
    const mblReview = this.workflow.mblReview();
    const drafts = this.workflow.hblReviews();
    const batchId = drafts[0]?.batch_id;
    
    if (mblReview && batchId) {
      this.isGenerating.set(true);
      
      this.extractionService.generateMblBase64(mblReview.mbl_details, batchId).subscribe({
        next: (response) => {
          const pdfUrl = base64PdfToObjectUrl(response.base64);
          this.workflow.setMblReview({
            ...mblReview,
            mbl_number: mblReview.mbl_details.mbl_number?.trim() || undefined,
            mbl_pdf: pdfUrl,
            mbl_filename: response.filename
          });
          this.toast.show('MBL Generated Successfully', 'success');
          this.isGenerating.set(false);
        },
        error: (error) => {
          const errorDetail = error?.error?.detail;
          const msg = typeof errorDetail === 'string'
            ? errorDetail
            : (Array.isArray(errorDetail) ? errorDetail.map((e: any) => e.msg).join(', ') : 'Failed to generate MBL. Please try again.');
          this.toast.show(msg, 'error');
          this.isGenerating.set(false);
          console.error('MBL generation error:', error);
        }
      });
    }
  }
}
