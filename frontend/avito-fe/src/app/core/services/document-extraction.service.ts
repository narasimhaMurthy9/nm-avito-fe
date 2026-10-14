import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BatchExtractionResponse, PackingList, ReviewDraft, HblManualDetails, MblManualDetails, ReassignDocumentsResponse } from '../models/schemas';
import { BackendApiService } from './backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentExtractionService {
  
  constructor(private backendApi: BackendApiService) {}

  uploadFiles(
    files: File[],
    groupIds?: (string | null)[],
    existingBatchId?: string
  ): Observable<BatchExtractionResponse> {
    return this.backendApi.uploadFiles(files, groupIds, existingBatchId);
  }

  /** The API is called without `include_base64`, so the response is the spreadsheet file itself. */
  downloadInvoiceSheet(batchId: string, format: 'xlsx' | 'csv' = 'xlsx'): Observable<Blob> {
    return this.backendApi.generateInvoiceSheet(batchId, format, false) as Observable<Blob>;
  }

  generateHbl(draft: ReviewDraft): Observable<Blob> {
    const request = {
      batch_id: draft.batch_id || '',
      group_id: draft.group_id || '',
      manual_details: draft.hbl_details as HblManualDetails
    };
    return this.backendApi.generateHbl(request);
  }

  generateHblBase64(draft: ReviewDraft): Observable<{ filename: string; base64: string }> {
    const request = {
      batch_id: draft.batch_id || '',
      group_id: draft.group_id || '',
      manual_details: draft.hbl_details as HblManualDetails
    };
    return this.backendApi.generateHblBase64(request);
  }

  previewHbl(batchId: string, groupId: string): Observable<{ filename: string; base64: string }> {
    return this.backendApi.previewHbl(batchId, groupId);
  }

  generateMbl(mblDetails: MblManualDetails, batchId: string): Observable<Blob> {
    const request = {
      batch_id: batchId,
      manual_details: mblDetails
    };
    return this.backendApi.generateMbl(request);
  }

  generateMblBase64(mblDetails: MblManualDetails, batchId: string): Observable<{ filename: string; base64: string }> {
    const request = {
      batch_id: batchId,
      manual_details: mblDetails
    };
    return this.backendApi.generateMblBase64(request);
  }

  previewMbl(batchId: string, mblDetails: MblManualDetails): Observable<{ filename: string; base64: string }> {
    return this.backendApi.previewMbl(batchId, mblDetails);
  }

  /**
   * Tells the server that documents moved between two of its own HBL groups, so the stored
   * batch keeps the same grouping the UI shows. Without this the server still expects an
   * HBL for the group a document was dragged out of and refuses to build the MBL.
   */
  reassignDocuments(
    batchId: string,
    sourceGroupId: string,
    targetGroupId: string,
    documentIds: string[],
    createTargetGroup = false
  ): Observable<ReassignDocumentsResponse> {
    return this.backendApi.reassignDocuments(
      batchId, sourceGroupId, targetGroupId, documentIds, createTargetGroup
    );
  }
}
