import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { UploaderComponent } from '../../features/logistics/components/uploader/uploader.component';
import { WifiLoaderComponent } from '../../shared/components/wifi-loader/wifi-loader.component';
import { DocumentExtractionService } from '../../core/services/document-extraction.service';
import { BatchExtractionResponse, PackingList } from '../../core/models/schemas';
import { DocumentModalComponent } from '../../shared/components/document-modal/document-modal.component';


interface ExtractedInvoice {
  invoiceNumber: string;
  date: string;
  amount: string;
  vendorName: string;
}

@Component({
  selector: 'app-invoice-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UploaderComponent, WifiLoaderComponent, DocumentModalComponent],
  template: `
    <div class="layout-container">
      <main class="main-layout">
        <!-- Left Column: Uploader -->
        <div class="left-panel">
          <header class="app-header" style="justify-content: center; width: 100%; position: relative;">
            <a routerLink="/" style="position: absolute; left: 0; display: flex; align-items: center; gap: 4px; text-decoration: none; color: #64748b; font-weight: 500; font-size: 14px;">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
               Back
            </a>
            <div class="logo-container" style="justify-content: center;">
              <img src="avito.png" alt="Avito Logo" class="header-logo" />
            </div>
          </header>

          <app-uploader buttonText="Extract Invoices" [showPreview]="true" (previewFile)="onPreviewFile($event)" (filesSelected)="onFilesSelected($event)"></app-uploader>
        </div>

        <!-- Right Column: Results -->
        <div class="right-panel" [class.panel-disabled]="!hasProcessed()">
          <div class="review-content" style="padding-top: 24px;">
            
            <!-- Result Table Structure (always visible, disabled if not processed) -->
            <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #1a2b4c; font-weight: 600;">Extracted Invoices</h3>
                <button (click)="downloadSpreadsheet()" [disabled]="!hasProcessed()" style="padding: 0.5rem 1rem; background: #fef1eb; color: #f26d21; border: 1px solid #f26d21; border-radius: 4px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download
                </button>
              </div>
                <div style="overflow-x: auto; width: 100%;">
                <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 1rem 1.25rem; text-align: center; font-weight: 600; color: #475569; width: 60px; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">S.No</th>
                    <th style="padding: 1rem 1.25rem; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Invoice No</th>
                    <th style="padding: 1rem 1.25rem; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Date (DD/MM/YYYY)</th>
                    <th style="padding: 1rem 1.25rem; text-align: right; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Vendor Name</th>
                    <th style="padding: 1rem 1.25rem; text-align: right; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let invoice of extractedInvoices(); let i = index" style="background: #ffffff; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#ffffff'">
                    <td style="padding: 1rem 1.25rem; color: #64748b; text-align: center; font-weight: 500; border-bottom: 1px solid #e2e8f0;">{{ i + 1 }}</td>
                    <td style="padding: 1rem 1.25rem; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">{{ invoice.invoiceNumber }}</td>
                    <td style="padding: 1rem 1.25rem; color: #64748b; border-bottom: 1px solid #e2e8f0;">{{ invoice.date }}</td>
                    <td style="padding: 1rem 1.25rem; text-align: right; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">{{ invoice.vendorName }}</td>
                    <td style="padding: 1rem 1.25rem; text-align: right; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">{{ invoice.amount }}</td>
                  </tr>
                  <tr *ngIf="!hasProcessed()">
                     <td colspan="4" style="padding: 3rem 2rem; text-align: center; color: #94a3b8; background: #ffffff;">Awaiting extraction...</td>
                  </tr>
                </tbody>
              </table>
                </div>

              

              
            </div>
          </div>

        </div>
      </main>
    </div>

    <app-wifi-loader [show]="isProcessing()" text="processing invoices"></app-wifi-loader>
  @if (selectedDocUrl()) {
      <app-document-modal
        [isOpen]="true"
        [title]="selectedDocName()"
        [documentUrl]="selectedDocUrl()!"
        [mimeType]="selectedDocMime()"
        (closed)="closeDoc()">
      </app-document-modal>
    }
    `,
  styleUrls: ['../mbl-flow/mbl-flow.component.css'],
  styles: [`
    .primary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceFlowComponent {
  selectedFiles = signal<File[]>([]);
  isProcessing = signal<boolean>(false);
  hasProcessed = signal<boolean>(false);
  extractedInvoices = signal<ExtractedInvoice[]>([]);
  batchId = signal<string | null>(null);
selectedDocUrl = signal<string | null>(null);
  selectedDocName = signal<string>('');
  selectedDocMime = signal<string>('');
  constructor(
    private toast: ToastService,
    private extractionService: DocumentExtractionService
  ) {}
  onPreviewFile(file: File) {
    const url = URL.createObjectURL(file);
    this.selectedDocUrl.set(url);
    this.selectedDocName.set(file.name);
    this.selectedDocMime.set(file.type);
  }

  closeDoc() {
    const url = this.selectedDocUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.selectedDocUrl.set(null);
  }
  onFilesSelected(files: File[]) {
    this.selectedFiles.set(files);
    this.processInvoices();
  }

  processInvoices() {
    if (this.selectedFiles().length === 0) return;

    this.isProcessing.set(true);

    this.extractionService.uploadFiles(this.selectedFiles()).subscribe({
      next: (response: BatchExtractionResponse) => {
        this.batchId.set(response.batch_id);
        this.extractedInvoices.set(
          response.documents.map((document) => this.toInvoiceRow(document.extraction))
        );
        this.isProcessing.set(false);
        this.hasProcessed.set(true);
        this.toast.show('Invoices processed successfully', 'success');
      },
      error: (error) => {
        this.isProcessing.set(false);
        const errorDetail = error?.error?.detail;
        const msg = typeof errorDetail === 'string'
          ? errorDetail
          : (Array.isArray(errorDetail) ? errorDetail.map((e: any) => e.msg).join(', ') : 'Failed to extract data from files. Please try again.');
        this.toast.show(msg, 'error');
        console.error('Invoice extraction error:', error);
      }
    });
  }

  downloadSpreadsheet() {
    const batchId = this.batchId();
    if (!batchId) return;

    this.extractionService.downloadInvoiceSheet(batchId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'invoice-sheets.xlsx';
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        const errorDetail = error?.error?.detail;
        const msg = typeof errorDetail === 'string'
          ? errorDetail
          : (Array.isArray(errorDetail) ? errorDetail.map((e: any) => e.msg).join(', ') : 'Failed to generate the spreadsheet. Please try again.');
        this.toast.show(msg, 'error');
        console.error('Invoice sheet error:', error);
      }
    });
  }

  reset() {
    this.selectedFiles.set([]);
    this.hasProcessed.set(false);
    this.extractedInvoices.set([]);
    this.batchId.set(null);
  }

  private toInvoiceRow(extraction: PackingList): ExtractedInvoice {
    const vendorName = extraction?.vendor?.name
      || extraction?.vendor_name?.name
      || extraction?.shipper_exporter?.name
      || '';
    return {
      invoiceNumber: extraction?.invoice_number?.trim() || '-',
      date: this.formatDate(extraction?.invoice_date || extraction?.date_of_issue || extraction?.packing_list_date || ''),
      vendorName: vendorName.trim().split(/\r?\n/)[0].trim() || '-',
      amount: this.formatRupees(this.parseAmount(extraction?.total_amount || ''))
    };
  }

  private formatDate(value: string): string {
    const dateText = value.trim();
    const isoDate = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoDate) {
      return this.formatDateParts(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3])) || dateText;
    }

    const namedDate = dateText.match(/^(\d{1,2})\s+([a-z]+),?\s*(\d{4})$/i);
    if (namedDate) {
      const month = [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
      ].findIndex(name => name === namedDate[2].slice(0, 3).toLowerCase()) + 1;
      return this.formatDateParts(Number(namedDate[3]), month, Number(namedDate[1])) || dateText;
    }

    const numericDate = dateText.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (numericDate) {
      return this.formatDateParts(
        Number(numericDate[3]),
        Number(numericDate[2]),
        Number(numericDate[1])
      ) || dateText;
    }

    return dateText || '-';
  }

  private formatDateParts(year: number, month: number, day: number): string | null {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return null;
    }
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  private formatRupees(amount: number | null): string {
    return amount === null
      ? '-'
      : `Rs.${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amount)}`;
  }

  private parseAmount(value: string): number | null {
    const match = value.replace(/[\s ]/g, '').match(/[+-]?[\d.,]+/);
    if (!match) return null;
    const raw = match[0];
    const lastComma = raw.lastIndexOf(',');
    const lastPeriod = raw.lastIndexOf('.');
    const decimalIndex = Math.max(lastComma, lastPeriod);
    const decimalDigits = raw.length - decimalIndex - 1;
    const hasBothSeparators = lastComma >= 0 && lastPeriod >= 0;
    const hasDecimalSeparator = decimalIndex >= 0 && decimalDigits > 0 && decimalDigits <= 2;
    const normalized = hasDecimalSeparator && (hasBothSeparators || decimalDigits !== 3)
      ? `${raw.slice(0, decimalIndex).replace(/[.,]/g, '')}.${raw.slice(decimalIndex + 1)}`
      : raw.replace(/[.,]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
