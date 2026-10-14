import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  mockStore, 
  getMockHblPreview, 
  getMockHblGenerated, 
  getMockMblPreview, 
  getMockMblGenerated, 
  getMockInvoiceSpreadsheet 
} from '../mocks/mock-data';

/**
 * Checks whether mock API is active.
 * Checked in order:
 * 1. URL parameter: ?mock=true | ?mock=false
 * 2. LocalStorage: USE_MOCK_API = 'true' | 'false'
 * 3. Environment configuration: environment.useMockApi (defaults to true)
 */
export function isMockApiEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.has('mock')) {
      return params.get('mock') !== 'false';
    }
    const stored = localStorage.getItem('USE_MOCK_API');
    if (stored !== null) {
      return stored === 'true';
    }
  }
  return !!(environment as any).useMockApi;
}

export function setMockApiEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('USE_MOCK_API', enabled ? 'true' : 'false');
  }
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isMockApiEnabled()) {
    return next(req);
  }

  // Parse request URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(req.url, environment.apiBaseUrl || 'http://localhost:8000');
  } catch {
    return next(req);
  }

  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // 1. Health check
  if (pathname === '/health') {
    console.log('[Mock API] Intercepted GET /health');
    return of(new HttpResponse({
      status: 200,
      body: { status: 'healthy', mock: true, timestamp: new Date().toISOString() }
    })).pipe(delay(200));
  }

  // 2. Batch extractions upload
  if (pathname === '/v1/extractions/batch' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/extractions/batch');
    let files: File[] = [];
    let groupIds: (string | null)[] = [];
    let existingBatchId: string | undefined;

    if (req.body instanceof FormData) {
      const rawDocs = req.body.getAll('documents');
      files = rawDocs.map((item, idx) => {
        if (item instanceof File) {
          return item;
        }
        return new File(['%PDF-1.4 sample content'], String(item) || `packing_list_${idx + 1}.pdf`, {
          type: 'application/pdf'
        });
      });

      const rawGroups = req.body.getAll('group_ids');
      if (rawGroups && rawGroups.length > 0) {
        groupIds = rawGroups.map(g => g ? String(g) : null);
      }

      const existingId = req.body.get('existing_batch_id');
      if (existingId) {
        existingBatchId = String(existingId);
      }
    }

    if (files.length === 0) {
      files = [
        new File(['%PDF-1.4 sample content'], 'Packing_List_101.pdf', { type: 'application/pdf' }),
        new File(['%PDF-1.4 sample content'], 'Packing_List_102.pdf', { type: 'application/pdf' })
      ];
    }

    const response = mockStore.createBatch(files, groupIds.length > 0 ? groupIds : undefined, existingBatchId);
    return of(new HttpResponse({
      status: 200,
      body: response
    })).pipe(delay(750));
  }

  // 3. Document reassignment between HBL groups
  if (pathname === '/v1/hbl-groups/reassign' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/hbl-groups/reassign', req.body);
    const body = req.body as any;
    const response = mockStore.reassignDocuments(
      body?.batch_id || '',
      body?.source_group_id || '',
      body?.target_group_id || '',
      body?.added_document_ids || [],
      !!body?.create_target_group
    );

    return of(new HttpResponse({
      status: 200,
      body: response
    })).pipe(delay(400));
  }

  // 4. Preview HBL
  if (pathname === '/v1/hbl/preview' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/hbl/preview', req.body);
    const body = req.body as any;
    const response = getMockHblPreview(body?.batch_id || '', body?.group_id || '');
    return of(new HttpResponse({
      status: 200,
      body: response
    })).pipe(delay(500));
  }

  // 5. Generate HBL (base64 JSON or Blob)
  if (pathname === '/v1/hbls' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/hbls', req.body);
    const includeBase64 = searchParams.get('include_base64') === 'true';
    const generated = getMockHblGenerated(req.body as any);

    if (includeBase64) {
      return of(new HttpResponse({
        status: 200,
        body: { filename: generated.filename, base64: generated.base64 }
      })).pipe(delay(650));
    }

    return of(new HttpResponse({
      status: 200,
      body: generated.blob
    })).pipe(delay(650));
  }

  // 6. Preview MBL
  if (pathname === '/v1/mbl/preview' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/mbl/preview', req.body);
    const body = req.body as any;
    const response = getMockMblPreview(body?.batch_id || '', body?.manual_details || {});
    return of(new HttpResponse({
      status: 200,
      body: response
    })).pipe(delay(500));
  }

  // 7. Generate MBL (base64 JSON or Blob)
  if (pathname === '/v1/mbls' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/mbls', req.body);
    const includeBase64 = searchParams.get('include_base64') === 'true';
    const generated = getMockMblGenerated(req.body as any);

    if (includeBase64) {
      return of(new HttpResponse({
        status: 200,
        body: { filename: generated.filename, base64: generated.base64 }
      })).pipe(delay(700));
    }

    return of(new HttpResponse({
      status: 200,
      body: generated.blob
    })).pipe(delay(700));
  }

  // 8. Generate Invoice spreadsheet
  if (pathname === '/v1/invoice-sheets' && req.method === 'POST') {
    console.log('[Mock API] Intercepted POST /v1/invoice-sheets', req.body);
    const format = (searchParams.get('format') as 'xlsx' | 'csv') || 'xlsx';
    const includeBase64 = searchParams.get('include_base64') === 'true';
    const body = req.body as any;
    const blob = getMockInvoiceSpreadsheet(body?.batch_id || '', format);

    if (includeBase64) {
      return new Observable<HttpResponse<any>>((observer) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = (reader.result as string) || '';
          const b64 = res.includes(',') ? res.split(',')[1] : res;
          observer.next(new HttpResponse({
            status: 200,
            body: { filename: `invoice-sheets.${format}`, base64: b64 }
          }));
          observer.complete();
        };
        reader.readAsDataURL(blob);
      }).pipe(delay(600));
    }

    return of(new HttpResponse({
      status: 200,
      body: blob
    })).pipe(delay(600));
  }

  // Fallthrough to actual backend for any unmocked routes
  return next(req);
};
