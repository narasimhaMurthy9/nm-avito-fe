import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PackingListItem, ReviewDraft } from '../../../../core/models/schemas';
import { DocumentModalComponent } from '../../../../shared/components/document-modal/document-modal.component';
import { ToastService } from '../../../../core/services/toast.service';
import { WorkflowStateService } from '../../../../core/services/workflow-state.service';
import { DocumentExtractionService } from '../../../../core/services/document-extraction.service';
import { base64PdfToObjectUrl, revokeObjectUrl } from '../../../../shared/utils/document-preview';

@Component({
  selector: 'app-hbl-draft',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentModalComponent],
  templateUrl: './hbl-draft.component.html',
  styleUrls: ['./hbl-draft.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HblDraftComponent {
  workflow = inject(WorkflowStateService);

  @Input() drafts: ReviewDraft[] = [];
  @Input() expanded = false;
  @Input() groupColor: string | null = null;
  @Input() groupTitle?: string;
  
  @Output() generateRequested = new EventEmitter<ReviewDraft[]>();
  
  formData: any;
  
  selectedDocUrl: string | null = null;
  selectedDocName: string = '';
  selectedDocMime: string = '';
  selectedPackingListIndex: number = 0;

  hblPreviewUrl = signal<string | null>(null);
  hblPreviewName = signal<string>('');
  isHblPreviewLoading = signal<boolean>(false);

  constructor(
    private toast: ToastService,
    private extractionService: DocumentExtractionService
  ) {}

  ngOnInit() {
    this.formData = JSON.parse(JSON.stringify(this.drafts[0]?.hbl_details || {}));
    if (!this.formData.notify_party) {
      this.formData.notify_party = { name: '', address: '', tax_id: null };
    }
    this.selectedPackingListIndex = 0;
  }

  ngOnChanges(changes: any) {
    if (changes['drafts']) {
      this.selectedPackingListIndex = 0;
      if (this.drafts.length > 0) {
        this.formData = JSON.parse(JSON.stringify(this.drafts[0]?.hbl_details || {}));
        if (!this.formData.notify_party) {
          this.formData.notify_party = { name: '', address: '', tax_id: null };
        }
      } else {
        this.formData = null;
      }
    }
  }

  viewSelectedDoc() {
    const draft = this.drafts[this.selectedPackingListIndex] || this.drafts[0];
    if (draft) {
      this.viewDoc(draft);
    }
  }

  viewDoc(draft: ReviewDraft) {
    this.selectedDocUrl = draft.source_document || null;
    this.selectedDocName = draft.source_name;
    this.selectedDocMime = draft.mime_type;
  }

  closeDoc() {
    this.selectedDocUrl = null;
  }

  viewHblPreview(draft: ReviewDraft) {
    const batchId = draft.batch_id;
    const groupId = draft.group_id;
    if (!batchId || !groupId) {
      this.toast.show('This HBL is missing its batch reference and cannot be previewed.', 'error');
      return;
    }

    this.isHblPreviewLoading.set(true);
    this.extractionService.previewHbl(batchId, groupId).pipe(
      finalize(() => this.isHblPreviewLoading.set(false))
    ).subscribe({
      next: (response) => {
        this.hblPreviewName.set(response.filename);
        this.hblPreviewUrl.set(base64PdfToObjectUrl(response.base64));
      },
      error: () => {
        this.toast.show('Could not build the HBL preview. Please try again.', 'error');
      }
    });
  }

  closeHblPreview() {
    revokeObjectUrl(this.hblPreviewUrl());
    this.hblPreviewUrl.set(null);
    this.hblPreviewName.set('');
  }

  saveDetails(form: NgForm) {
    if (form.invalid) {
      this.drafts.forEach(d => {
        d.details_confirmed = false;
        this.workflow.updateDraft(d.draft_id, { details_confirmed: false });
      });
      this.toast.show('Please complete all required fields.', 'error');
      return;
    }
    
    const savedData = JSON.parse(JSON.stringify(this.formData));
    if (!savedData.notify_party) {
      savedData.notify_party = { name: null, address: null, tax_id: null };
    }
    const newHblNumber = savedData.hbl_number;

    // Validation: HBL Number must be unique across different groups
    const currentDraftIds = new Set(this.drafts.map(d => d.draft_id));
    const isDuplicate = this.workflow.hblReviews().some(r => 
      !currentDraftIds.has(r.draft_id) && 
      r.hbl_number === newHblNumber
    );

    if (isDuplicate) {
      form.controls['hblNumber']?.setErrors({ duplicate: true });
      this.toast.show('This HBL number is already in use by another group. Please enter a different HBL number.', 'error');
      return;
    }

    this.drafts.forEach(d => {
      d.details_confirmed = true;
      d.hbl_details = JSON.parse(JSON.stringify(savedData));
      d.hbl_number = savedData.hbl_number || undefined;
      this.workflow.updateDraft(d.draft_id, {
        details_confirmed: true,
        hbl_details: savedData,
        hbl_number: savedData.hbl_number || undefined
      });
    });
    this.toast.show('HBL Details Saved successfully for selected packing lists', 'success');
    
    // Automatically trigger generation since the button was clicked
    this.generateHbl();
  }

  generateHbl() {
    this.expanded = false;
    this.generateRequested.emit(this.drafts);
  }

  get primaryDraft(): ReviewDraft {
    return this.drafts[0];
  }

  get groupPackingList() {
    return this.primaryDraft?.group_packing_list || this.primaryDraft?.packing_list;
  }

  get isLocked(): boolean {
    return this.drafts.some(d => !!d.hbl_pdf);
  }

  get detailsConfirmed(): boolean {
    return this.drafts.every(d => d.details_confirmed);
  }

  sortColumn: 'key' | 'value' = 'key';
  sortDirection: 'asc' | 'desc' = 'asc';

  toggleSort(column: 'key' | 'value') {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  itemsSortColumn = '';
  itemsSortDirection: 'asc' | 'desc' = 'asc';

  toggleItemsSort(column: string) {
    if (this.itemsSortColumn === column) {
      this.itemsSortDirection = this.itemsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.itemsSortColumn = column;
      this.itemsSortDirection = 'asc';
    }
  }

  getItems(): any[] {
    let items = [...(this.groupPackingList?.items || [])];
    if (this.itemsSortColumn) {
      items.sort((a, b) => {
        let valA = String((a as any)[this.itemsSortColumn] || 0).toLowerCase();
        let valB = String((b as any)[this.itemsSortColumn] || 0).toLowerCase();
        if (valA < valB) return this.itemsSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.itemsSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }

  formatNetWeight(value: string | null | undefined): string {
    const weight = (value || '').replace(/\s*kgs?\s*$/i, '').trim();
    const multiplication = weight.match(
      /^\s*([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*[*x×]\s*([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*$/
    );
    if (!multiplication) return weight;

    const left = multiplication[1].replace(/,/g, '');
    const right = multiplication[2].replace(/,/g, '');
    const decimalPlaces = (left.split('.')[1]?.length || 0) + (right.split('.')[1]?.length || 0);
    if (decimalPlaces > 12) return weight;

    const result = Number(left) * Number(right);
    if (!Number.isFinite(result)) return weight;
    const formatted = result.toFixed(decimalPlaces);
    return formatted.includes('.')
      ? formatted.replace(/0+$/, '').replace(/\.$/, '')
      : formatted;
  }

  formatGoodsDescription(value: string | null | undefined): string {
    return (value || '')
      .replace(
        /\bparts\s+of\s+air\s+or\s+vac(?:uu|cu)m\s+pumps?\s*(?:&|and)\s*compressors?\s*[-–—]?\s*others?(?:\s*\(?\s*\d{6,10}\s*\)?)?/gi,
        ''
      )
      .split(/[\r\n;]+/)
      .map(item => item.replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, '').trim())
      .filter(Boolean)
      .join(', ');
  }

  getItemGoodsDescription(item: PackingListItem): string {
    const mainDescription = item.source_filename
      ? item.source_main_item_description || this.groupPackingList?.main_item_description
      : this.groupPackingList?.main_item_description;
    const main = this.formatGoodsDescription(mainDescription);
    const subItem = this.formatGoodsDescription(item.item_product_description);

    if (!main) return subItem;
    if (!subItem || main.toLocaleLowerCase() === subItem.toLocaleLowerCase()) return main;
    return `${main}, ${subItem}`;
  }

  getExtractedData(): { key: string, value: string }[] {
    if (!this.groupPackingList) return [];
    const pl = this.groupPackingList as any;
    console.log('Packing List:', pl);
    const result: { key: string, value: string }[] = [];

    const allowedKeys = [
      'notify_party',
      'country_of_origin',
      'country_of_final_destination',
      'total_gross_weight',
      'total_package_count',
      'total_net_weight'
    ];

    const pushItem = (k: string, v: any) => {
      const formattedKey = this.formatKey(k);
      if (result.some(r => r.key === formattedKey)) return;
      const val = (v === null || v === undefined || v === '') ? '--' : String(v);
      result.push({ key: formattedKey, value: val });
    };

    const processValue = (prefix: string, leafKey: string, val: any) => {
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] !== 'object') {
          if (allowedKeys.includes(leafKey) || leafKey.endsWith('_date')) {
            pushItem(leafKey, val.join(', '));
          }
        } else {
          val.forEach((item, index) => {
            if (item && typeof item === 'object') {
              for (const k of Object.keys(item)) {
                processValue(`${prefix}_${index + 1}_${k}`, k, item[k]);
              }
            }
          });
        }
      } else if (val && typeof val === 'object') {
        if (allowedKeys.includes(leafKey) || leafKey.endsWith('_date')) {
          pushItem(leafKey, val.name || '--');
        }
      } else {
        if (allowedKeys.includes(leafKey) || leafKey.endsWith('_date')) {
          pushItem(leafKey, val);
        }
      }
    };

    for (const key of Object.keys(pl)) {
      processValue(key, key, pl[key]);
    }

    if (pl.consignee) {
      const cName = pl.consignee.name || '--';
      const cAddress = pl.consignee.address || '--';
      
      const tnwIndex = result.findIndex(r => r.key === 'Total Net Weight');
      if (tnwIndex !== -1) {
        result.splice(tnwIndex + 1, 0, 
          { key: 'Consignee Name', value: cName },
          { key: 'Consignee Address', value: cAddress }
        );
      } else {
        result.push(
          { key: 'Consignee Name', value: cName },
          { key: 'Consignee Address', value: cAddress }
        );
      }
    }

    if (pl.shipper_exporter) {
      console.log('Shipper:', pl.shipper_exporter);
      const sName = pl.shipper_exporter.name || '--';
      const sAddress = pl.shipper_exporter.address || '--';
      
      const tnwIndex = result.findIndex(r => r.key === 'Total Net Weight');
      if (tnwIndex !== -1) {
        result.splice(tnwIndex + 1, 0,
          { key: 'Shipper Name', value: sName },
          { key: 'Shipper Address', value: sAddress }
        );
      } else {
        result.push(
          { key: 'Shipper Name', value: sName },
          { key: 'Shipper Address', value: sAddress }
        );
      }
    }
    return result;
  }

  formatKey(key: string): string {
    return key
      .split(/[ _]/)
      .filter(w => w.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
