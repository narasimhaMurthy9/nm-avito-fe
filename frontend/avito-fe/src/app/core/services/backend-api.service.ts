import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  PackingList, 
  HblManualDetails, 
  MblManualDetails,
  ExtractedDocument,
  BatchExtractionResponse,
  ReassignDocumentsResponse,
  HblGenerationRequest,
  MblGenerationRequest
} from '../models/schemas';

@Injectable({
  providedIn: 'root'
})
export class BackendApiService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Uploads packing lists for extraction.
   *
   * `groupIds` is optional and positionally aligned with `files`. Documents sharing an id
   * are grouped together on the server and keep that id as their HBL group id. Pass `null`
   * (or an empty string) for a document you want the server to group by shipper and
   * consignee instead. Omit the argument entirely to keep the automatic behaviour.
   */
  uploadFiles(
    files: File[],
    groupIds?: (string | null)[],
    existingBatchId?: string
  ): Observable<BatchExtractionResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('documents', file, file.name);
      if (groupIds && index < groupIds.length) {
        formData.append('group_ids', groupIds[index] ?? '');
      }
    });
    if (existingBatchId) {
      formData.append('existing_batch_id', existingBatchId);
    }
    return this.http.post<BatchExtractionResponse>(`${this.apiUrl}/v1/extractions/batch`, formData);
  }

  generateHbl(request: HblGenerationRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/v1/hbls`, request, { responseType: 'blob' });
  }

  generateHblBase64(request: HblGenerationRequest): Observable<{ filename: string; base64: string }> {
    return this.http.post<{ filename: string; base64: string }>(`${this.apiUrl}/v1/hbls?include_base64=true`, request);
  }

  previewHbl(batchId: string, groupId: string): Observable<{ filename: string; base64: string }> {
    return this.http.post<{ filename: string; base64: string }>(`${this.apiUrl}/v1/hbl/preview`, { batch_id: batchId, group_id: groupId });
  }

  generateMbl(request: MblGenerationRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/v1/mbls`, request, { responseType: 'blob' });
  }

  generateMblBase64(request: MblGenerationRequest): Observable<{ filename: string; base64: string }> {
    return this.http.post<{ filename: string; base64: string }>(`${this.apiUrl}/v1/mbls?include_base64=true`, request);
  }

  previewMbl(batchId: string, manualDetails: MblManualDetails): Observable<{ filename: string; base64: string }> {
    return this.http.post<{ filename: string; base64: string }>(`${this.apiUrl}/v1/mbl/preview`, {
      batch_id: batchId,
      manual_details: manualDetails
    });
  }

  reassignDocuments(batchId: string, sourceGroupId: string, targetGroupId: string, documentIds: string[], createTargetGroup = false): Observable<ReassignDocumentsResponse> {
    return this.http.post<ReassignDocumentsResponse>(`${this.apiUrl}/v1/hbl-groups/reassign`, {
      batch_id: batchId,
      source_group_id: sourceGroupId,
      target_group_id: targetGroupId,
      added_document_ids: documentIds,
      create_target_group: createTargetGroup
    });
  }

  generateInvoiceSheet(batchId: string, format: 'xlsx' | 'csv' = 'xlsx', includeBase64 = false): Observable<Blob | { filename: string; base64: string }> {
    const url = `${this.apiUrl}/v1/invoice-sheets?format=${format}&include_base64=${includeBase64}`;
    if (includeBase64) {
      return this.http.post<{ filename: string; base64: string }>(url, { batch_id: batchId });
    }
    return this.http.post(url, { batch_id: batchId }, { responseType: 'blob' });
  }

  checkHealth(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.apiUrl}/health`);
  }
}
