import { 
  BatchExtractionResponse, 
  ExtractedDocument, 
  HblGroup, 
  PackingList, 
  PackingListItem, 
  ContainerDetail, 
  Party, 
  HblGenerationRequest, 
  MblGenerationRequest, 
  MblManualDetails, 
  ReassignDocumentsResponse 
} from '../models/schemas';
import { generateDemoPdf } from './mock-pdf-generator';

const TEMPLATES: Array<{
  shipper: Party;
  consignee: Party;
  buyer: Party;
  notify: Party;
  vessel: string;
  voyage: string;
  pol: string;
  pod: string;
  destination: string;
  incoterms: string;
  freightTerms: string;
  containerNumber: string;
  sealNumber: string;
  mainDescription: string;
  items: Array<{
    description: string;
    hsn: string;
    packages: string;
    netWeight: string;
    qty: string;
    rate: string;
    amount: string;
  }>;
}> = [
  {
    shipper: {
      name: 'ACME EXPORTS PVT LTD',
      address: 'Plot 42, SEZ Phase II, Guindy, Chennai, TN 600032, India',
      tax_id: '33AABCA1234F1Z5'
    },
    consignee: {
      name: 'GLOBAL LOGISTICS LLC',
      address: '742 Evergreen Terrace, Suite 100, Springfield, OR 97477, USA',
      tax_id: 'US-987654321'
    },
    buyer: {
      name: 'PACIFIC RETAIL CORP',
      address: '100 Market St, San Francisco, CA 94105, USA',
      tax_id: 'US-112233445'
    },
    notify: {
      name: 'OCEANIC NOTIFY AGENTS INC',
      address: 'Harbor Gateway 12, Long Beach, CA 90802, USA',
      tax_id: 'US-554433221'
    },
    vessel: 'MSC BARI',
    voyage: 'VOY-2401W',
    pol: 'Chennai, India (INMAA)',
    pod: 'Long Beach, CA (USLGB)',
    destination: 'Los Angeles, CA',
    incoterms: 'FOB Chennai',
    freightTerms: 'Prepaid',
    containerNumber: 'MSCU7829104',
    sealNumber: 'ML-IN-893021',
    mainDescription: 'Precision Ball Bearings & Bushings',
    items: [
      {
        description: 'Precision Deep Groove Ball Bearings (Series 6200)',
        hsn: '8482.10.10',
        packages: '250 Cartons',
        netWeight: '3,850 KGS',
        qty: '1200',
        rate: '75.00',
        amount: '90000.00'
      },
      {
        description: 'Cylindrical Roller Bearings & Steel Bushings',
        hsn: '8482.50.00',
        packages: '200 Cartons',
        netWeight: '2,570 KGS',
        qty: '800',
        rate: '73.125',
        amount: '58500.00'
      }
    ]
  },
  {
    shipper: {
      name: 'ACME EXPORTS PVT LTD',
      address: 'Plot 42, SEZ Phase II, Guindy, Chennai, TN 600032, India',
      tax_id: '33AABCA1234F1Z5'
    },
    consignee: {
      name: 'GLOBAL LOGISTICS LLC',
      address: '742 Evergreen Terrace, Suite 100, Springfield, OR 97477, USA',
      tax_id: 'US-987654321'
    },
    buyer: {
      name: 'PACIFIC RETAIL CORP',
      address: '100 Market St, San Francisco, CA 94105, USA',
      tax_id: 'US-112233445'
    },
    notify: {
      name: 'OCEANIC NOTIFY AGENTS INC',
      address: 'Harbor Gateway 12, Long Beach, CA 90802, USA',
      tax_id: 'US-554433221'
    },
    vessel: 'MSC BARI',
    voyage: 'VOY-2401W',
    pol: 'Chennai, India (INMAA)',
    pod: 'Long Beach, CA (USLGB)',
    destination: 'Los Angeles, CA',
    incoterms: 'FOB Chennai',
    freightTerms: 'Prepaid',
    containerNumber: 'MSCU7829104',
    sealNumber: 'ML-IN-893021',
    mainDescription: 'High-Pressure Fluid Valves & Couplings',
    items: [
      {
        description: 'Stainless Steel Industrial Ball Valves (DN50)',
        hsn: '8481.80.30',
        packages: '320 Cartons',
        netWeight: '4,120 KGS',
        qty: '650',
        rate: '126.77',
        amount: '82400.00'
      }
    ]
  },
  {
    shipper: {
      name: 'BHARAT FORGINGS & METALS',
      address: 'Sector 18, Industrial Area, Pune, MH 411018, India',
      tax_id: '27AABCB9876E1Z2'
    },
    consignee: {
      name: 'TRANS-ATLANTIC CARGO INC',
      address: '55 Commerce Way, Newark, NJ 07102, USA',
      tax_id: 'US-334455667'
    },
    buyer: {
      name: 'APEX INDUSTRIAL DISTRIBUTORS',
      address: '220 Fifth Ave, New York, NY 10001, USA',
      tax_id: 'US-887766554'
    },
    notify: {
      name: 'EAST COAST LOGISTICS SERVICES',
      address: 'Terminal 4, Port Newark, NJ 07114, USA',
      tax_id: 'US-443322110'
    },
    vessel: 'MSC BARI',
    voyage: 'VOY-2401W',
    pol: 'Chennai, India (INMAA)',
    pod: 'Long Beach, CA (USLGB)',
    destination: 'Los Angeles, CA',
    incoterms: 'CIF Long Beach',
    freightTerms: 'Prepaid',
    containerNumber: 'TGHU9182301',
    sealNumber: 'SEAL-990218',
    mainDescription: 'Forged Alloy Steel Rings & Flanges',
    items: [
      {
        description: 'Forged High-Tensile Steel Flanges (ANSI Class 300)',
        hsn: '7307.91.00',
        packages: '280 Wooden Crates',
        netWeight: '5,300 KGS',
        qty: '450',
        rate: '522.22',
        amount: '235000.00'
      }
    ]
  }
];

class MockDataStore {
  private batches = new Map<string, { documents: ExtractedDocument[]; hbl_groups: HblGroup[] }>();

  public createBatch(files: File[], groupIds?: (string | null)[], existingBatchId?: string): BatchExtractionResponse {
    let batchId = existingBatchId && this.batches.has(existingBatchId) 
      ? existingBatchId 
      : `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const existingBatch = this.batches.get(batchId);
    const startIndex = existingBatch ? existingBatch.documents.length : 0;

    const newDocuments: ExtractedDocument[] = files.map((file, i) => {
      const globalIndex = startIndex + i;
      const template = TEMPLATES[globalIndex % TEMPLATES.length];
      const docId = `doc_${batchId}_${globalIndex + 1}`;
      const invNum = `INV-2026-${String(globalIndex + 101).padStart(4, '0')}`;
      const plNum = `PL-2026-${String(globalIndex + 101).padStart(4, '0')}`;
      const dateStr = '2026-03-14';

      let totalPackagesNum = 0;
      let totalAmountNum = 0;
      let totalNetWeightNum = 0;

      const items: PackingListItem[] = template.items.map((it, itemIdx) => {
        const pkgCount = parseInt(it.packages, 10) || 100;
        const netWt = parseFloat(it.netWeight.replace(/[^0-9.]/g, '')) || 1000;
        const amt = parseFloat(it.amount) || 10000;

        totalPackagesNum += pkgCount;
        totalNetWeightNum += netWt;
        totalAmountNum += amt;

        return {
          source_invoice_number: invNum,
          source_filename: file.name,
          source_po_number: `PO-8849${globalIndex + 1}`,
          source_total_package_count: String(pkgCount),
          source_total_package_type: 'Cartons',
          product_code: `PRD-${it.hsn.replace('.', '')}-${itemIdx + 1}`,
          item_product_description: it.description,
          package_numbers: `1 - ${pkgCount}`,
          index_number: String(itemIdx + 1),
          hsn_code: it.hsn,
          quantity: it.qty,
          rate: it.rate,
          amount: it.amount,
          unit_of_measure: "PC'S",
          package_count: String(pkgCount),
          package_type: 'Cartons',
          gross_weight: `${(netWt * 1.08).toFixed(2)} KGS`,
          net_weight: `${netWt.toFixed(2)} KGS`,
          dimensions: '40x30x30 cm',
          cbm_volume: `${((pkgCount * 0.036)).toFixed(2)} CBM`,
          container_number: template.containerNumber,
          seal_number: template.sealNumber,
          shipping_marks: `${template.containerNumber} / ${template.shipper.name?.split(' ')[0]}`
        };
      });

      const totalGrossWeightNum = totalNetWeightNum * 1.08;
      const totalCbm = (totalPackagesNum * 0.036).toFixed(2);

      const containers: ContainerDetail[] = [
        {
          container_number: template.containerNumber,
          seal_numbers: [template.sealNumber],
          container_size_type: '40HC',
          package_count: String(totalPackagesNum),
          package_type: 'Cartons',
          gross_weight: `${totalGrossWeightNum.toFixed(2)} KGS`,
          net_weight: `${totalNetWeightNum.toFixed(2)} KGS`,
          cbm_measurement: totalCbm
        }
      ];

      const extraction: PackingList = {
        packing_list_number: plNum,
        packing_list_date: dateStr,
        invoice_number: invNum,
        invoice_date: dateStr,
        exporter_reference: `EXP-REF-${globalIndex + 9001}`,
        ie_code: '0512034912',
        branch_code: '001',
        buyer_order_number: `PO-8849${globalIndex + 1}`,
        buyer_order_date: '2026-03-10',
        other_references: [`LC-9938210-${globalIndex + 1}`, 'BL-INT-441'],
        shipper_exporter: JSON.parse(JSON.stringify(template.shipper)),
        consignee: JSON.parse(JSON.stringify(template.consignee)),
        buyer: JSON.parse(JSON.stringify(template.buyer)),
        notify_party: JSON.parse(JSON.stringify(template.notify)),
        country_of_origin: 'India',
        country_of_final_destination: 'United States',
        pre_carriage_by: 'Truck',
        place_of_receipt: 'Chennai CFS',
        vessel_name: template.vessel,
        voyage_or_flight_number: template.voyage,
        port_of_loading: template.pol,
        route_or_place_of_transshipment: null,
        port_of_discharge: template.pod,
        place_of_final_delivery: template.destination,
        type_of_movement: 'FCL/FCL',
        incoterms: template.incoterms,
        payment_terms: 'Letter of Credit at Sight',
        freight_terms: template.freightTerms,
        freight_amount: '4,250.00 USD',
        release_terms: 'Original BL Required',
        shipment_reference: `SHP-2026-${globalIndex + 1}`,
        place_of_issue: 'Chennai',
        date_of_issue: dateStr,
        shipped_on_board_date: dateStr,
        number_of_originals: '3',
        delivery_contact: '+1 555-0199',
        other_particulars: 'Clean On Board',
        marks_and_numbers: `${template.containerNumber} / ${template.shipper.name?.split(' ')[0]}`,
        total_package_count: String(totalPackagesNum),
        total_package_type: 'Cartons',
        total_gross_weight: `${totalGrossWeightNum.toFixed(2)} KGS`,
        total_net_weight: `${totalNetWeightNum.toFixed(2)} KGS`,
        total_measurement: `${totalCbm} CBM`,
        main_item_description: template.mainDescription,
        vendor: JSON.parse(JSON.stringify(template.shipper)),
        vendor_name: { name: template.shipper.name },
        total_amount: totalAmountNum.toFixed(2),
        items,
        containers
      };

      return {
        document_id: docId,
        filename: file.name,
        mime_type: file.type || 'application/pdf',
        extraction
      };
    });

    const allDocuments = existingBatch 
      ? [...existingBatch.documents, ...newDocuments] 
      : newDocuments;

    const hblGroups = this.buildHblGroups(allDocuments, groupIds);
    this.batches.set(batchId, { documents: allDocuments, hbl_groups: hblGroups });

    return {
      batch_id: batchId,
      documents: allDocuments,
      hbl_groups: hblGroups
    };
  }

  public reassignDocuments(
    batchId: string,
    sourceGroupId: string,
    targetGroupId: string,
    documentIds: string[],
    createTargetGroup = false
  ): ReassignDocumentsResponse {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return { batch_id: batchId, hbl_groups: [] };
    }

    let sourceGroup = batch.hbl_groups.find(g => g.group_id === sourceGroupId);
    let targetGroup = batch.hbl_groups.find(g => g.group_id === targetGroupId);

    if (sourceGroup) {
      sourceGroup.document_ids = sourceGroup.document_ids.filter(id => !documentIds.includes(id));
    }

    if (!targetGroup && createTargetGroup) {
      targetGroup = {
        group_id: targetGroupId,
        document_ids: [...documentIds],
        same_shipper_and_consignee: true,
        hbl_action: 'create_separate_hbl',
        reason: 'Manually reassigned group',
        combined_extraction: {} as any
      };
      batch.hbl_groups.push(targetGroup);
    } else if (targetGroup) {
      const merged = new Set([...targetGroup.document_ids, ...documentIds]);
      targetGroup.document_ids = Array.from(merged);
    }

    // Filter out completely empty source groups if not target
    batch.hbl_groups = batch.hbl_groups.filter(g => g.document_ids.length > 0 || g.group_id === targetGroupId);

    // Recompute combined extraction for remaining groups
    batch.hbl_groups.forEach(g => {
      const groupDocs = batch.documents.filter(d => g.document_ids.includes(d.document_id));
      g.combined_extraction = this.createCombinedExtraction(groupDocs);
      g.same_shipper_and_consignee = this.checkSameShipperConsignee(groupDocs);
      g.hbl_action = g.document_ids.length > 1 ? 'create_combined_hbl' : 'create_separate_hbl';
    });

    return {
      batch_id: batchId,
      hbl_groups: batch.hbl_groups
    };
  }

  public getBatch(batchId: string) {
    return this.batches.get(batchId);
  }

  private buildHblGroups(documents: ExtractedDocument[], explicitGroupIds?: (string | null)[]): HblGroup[] {
    const groupsMap = new Map<string, string[]>();

    documents.forEach((doc, idx) => {
      let gId: string | null = null;
      if (explicitGroupIds && idx < explicitGroupIds.length && explicitGroupIds[idx]) {
        gId = explicitGroupIds[idx]!;
      } else {
        const shipperKey = (doc.extraction.shipper_exporter?.name || 'unknown').toLowerCase().trim();
        const consigneeKey = (doc.extraction.consignee?.name || 'unknown').toLowerCase().trim();
        gId = `grp_${shipperKey.substring(0, 4)}_${consigneeKey.substring(0, 4)}`;
      }

      if (!groupsMap.has(gId)) {
        groupsMap.set(gId, []);
      }
      groupsMap.get(gId)!.push(doc.document_id);
    });

    const groups: HblGroup[] = [];
    let groupCounter = 1;

    for (const [, docIds] of groupsMap.entries()) {
      const groupDocs = documents.filter(d => docIds.includes(d.document_id));
      const groupId = `group_${groupCounter++}`;
      const sameShipperAndConsignee = this.checkSameShipperConsignee(groupDocs);

      groups.push({
        group_id: groupId,
        document_ids: docIds,
        same_shipper_and_consignee: sameShipperAndConsignee,
        hbl_action: docIds.length > 1 ? 'create_combined_hbl' : 'create_separate_hbl',
        reason: docIds.length > 1 
          ? 'Matching shipper and consignee across multiple packing lists' 
          : 'Single shipment packing list',
        combined_extraction: this.createCombinedExtraction(groupDocs)
      });
    }

    return groups;
  }

  private checkSameShipperConsignee(docs: ExtractedDocument[]): boolean {
    if (docs.length <= 1) return true;
    const firstShipper = docs[0].extraction.shipper_exporter?.name?.toLowerCase().trim();
    const firstConsignee = docs[0].extraction.consignee?.name?.toLowerCase().trim();

    return docs.every(d => 
      d.extraction.shipper_exporter?.name?.toLowerCase().trim() === firstShipper &&
      d.extraction.consignee?.name?.toLowerCase().trim() === firstConsignee
    );
  }

  private createCombinedExtraction(docs: ExtractedDocument[]): PackingList {
    if (docs.length === 0) {
      return {} as PackingList;
    }
    const base = JSON.parse(JSON.stringify(docs[0].extraction)) as PackingList;
    if (docs.length === 1) {
      return base;
    }

    let totalPkg = 0;
    let totalGross = 0;
    let totalNet = 0;
    let totalCbm = 0;
    let totalAmt = 0;
    const allItems: PackingListItem[] = [];
    const allContainers: ContainerDetail[] = [];

    docs.forEach(doc => {
      const pl = doc.extraction;
      totalPkg += parseInt(pl.total_package_count || '0', 10) || 0;
      totalGross += parseFloat((pl.total_gross_weight || '0').replace(/[^0-9.]/g, '')) || 0;
      totalNet += parseFloat((pl.total_net_weight || '0').replace(/[^0-9.]/g, '')) || 0;
      totalCbm += parseFloat((pl.total_measurement || '0').replace(/[^0-9.]/g, '')) || 0;
      totalAmt += parseFloat((pl.total_amount || '0').replace(/[^0-9.]/g, '')) || 0;

      if (pl.items) {
        allItems.push(...pl.items);
      }
      if (pl.containers) {
        allContainers.push(...pl.containers);
      }
    });

    base.total_package_count = String(totalPkg);
    base.total_gross_weight = `${totalGross.toFixed(2)} KGS`;
    base.total_net_weight = `${totalNet.toFixed(2)} KGS`;
    base.total_measurement = `${totalCbm.toFixed(2)} CBM`;
    base.total_amount = totalAmt.toFixed(2);
    base.items = allItems;
    base.containers = allContainers;

    return base;
  }
}

export const mockStore = new MockDataStore();

/**
 * Creates a mock HBL Preview PDF and returns base64 and filename
 */
export function getMockHblPreview(batchId: string, groupId: string): { filename: string; base64: string } {
  const batch = mockStore.getBatch(batchId);
  const group = batch?.hbl_groups.find(g => g.group_id === groupId);
  const pl = group?.combined_extraction || batch?.documents[0]?.extraction;

  const pdf = generateDemoPdf(
    `PREVIEW HOUSE BILL OF LADING (${groupId.toUpperCase()})`,
    [
      { label: 'HBL Status', value: 'DRAFT PREVIEW (UNLOCKED)' },
      { label: 'Shipper / Exporter', value: pl?.shipper_exporter?.name || 'ACME EXPORTS PVT LTD' },
      { label: 'Shipper Address', value: pl?.shipper_exporter?.address || 'Chennai, India' },
      { label: 'Consignee', value: pl?.consignee?.name || 'GLOBAL LOGISTICS LLC' },
      { label: 'Consignee Address', value: pl?.consignee?.address || 'Springfield, OR, USA' },
      { label: 'Notify Party', value: pl?.notify_party?.name || 'OCEANIC NOTIFY AGENTS' },
      { label: 'Ocean Vessel / Voyage', value: `${pl?.vessel_name || 'MSC BARI'} / ${pl?.voyage_or_flight_number || 'VOY-2401W'}` },
      { label: 'Port of Loading', value: pl?.port_of_loading || 'Chennai, India (INMAA)' },
      { label: 'Port of Discharge', value: pl?.port_of_discharge || 'Long Beach, CA (USLGB)' },
      { label: 'Place of Delivery', value: pl?.place_of_final_delivery || 'Los Angeles, CA' },
      { label: 'Total Packages', value: `${pl?.total_package_count || '450'} Cartons` },
      { label: 'Total Gross Weight', value: pl?.total_gross_weight || '6,850.00 KGS' },
      { label: 'Total Measurement', value: pl?.total_measurement || '32.50 CBM' }
    ],
    (pl?.items || []).map(it => `${it.package_count} pkgs | ${it.item_product_description} | HSN: ${it.hsn_code} | Net: ${it.net_weight}`)
  );

  return {
    filename: `HBL_PREVIEW_${groupId}.pdf`,
    base64: pdf.base64
  };
}

/**
 * Generates final HBL PDF base64
 */
export function getMockHblGenerated(request: HblGenerationRequest): { filename: string; base64: string; blob: Blob } {
  const batch = mockStore.getBatch(request.batch_id);
  const group = batch?.hbl_groups.find(g => g.group_id === request.group_id);
  const pl = group?.combined_extraction || batch?.documents[0]?.extraction;
  const hblNum = request.manual_details.hbl_number || `HBL-${request.group_id.toUpperCase()}-FINAL`;

  const pdf = generateDemoPdf(
    `FINAL HOUSE BILL OF LADING: ${hblNum}`,
    [
      { label: 'Final HBL Number', value: hblNum },
      { label: 'Container Number', value: request.manual_details.container_number || pl?.containers?.[0]?.container_number || 'MSCU7829104' },
      { label: 'Seal Number', value: request.manual_details.seal_number || pl?.containers?.[0]?.seal_numbers?.[0] || 'ML-IN-893021' },
      { label: 'Freight Terms', value: request.manual_details.freight_terms || 'Prepaid' },
      { label: 'Shipper / Exporter', value: pl?.shipper_exporter?.name || 'ACME EXPORTS PVT LTD' },
      { label: 'Consignee', value: pl?.consignee?.name || 'GLOBAL LOGISTICS LLC' },
      { label: 'Notify Party', value: request.manual_details.notify_party?.name || pl?.notify_party?.name || 'OCEANIC NOTIFY AGENTS' },
      { label: 'Port of Loading', value: pl?.port_of_loading || 'Chennai, India (INMAA)' },
      { label: 'Port of Discharge', value: pl?.port_of_discharge || 'Long Beach, CA (USLGB)' },
      { label: 'Total Packages', value: `${pl?.total_package_count || '450'} Cartons` },
      { label: 'Total Gross Weight', value: pl?.total_gross_weight || '6,850.00 KGS' },
      { label: 'Total Measurement', value: pl?.total_measurement || '32.50 CBM' }
    ],
    (pl?.items || []).map(it => `${it.package_count} Cartons | ${it.item_product_description} | Net: ${it.net_weight}`)
  );

  return {
    filename: `HBL_${hblNum}.pdf`,
    base64: pdf.base64,
    blob: pdf.blob
  };
}

/**
 * Creates a mock MBL Preview PDF
 */
export function getMockMblPreview(batchId: string, manualDetails: MblManualDetails): { filename: string; base64: string } {
  const mblNum = manualDetails.mbl_number || 'MBL-DRAFT-PREVIEW';
  const pdf = generateDemoPdf(
    `PREVIEW MASTER BILL OF LADING: ${mblNum}`,
    [
      { label: 'Master B/L Number', value: mblNum },
      { label: 'Carrier Booking Ref', value: manualDetails.carrier_booking_reference || 'BKG-MSC-992019' },
      { label: 'Pre-Carriage By', value: manualDetails.pre_carriage_by || 'Truck' },
      { label: 'Ocean Vessel', value: manualDetails.vessel_name || 'MSC BARI' },
      { label: 'Voyage Number', value: manualDetails.voyage_number || 'VOY-2401W' },
      { label: 'Port of Loading', value: manualDetails.port_of_loading || 'Chennai, India (INMAA)' },
      { label: 'Port of Discharge', value: manualDetails.port_of_discharge || 'Long Beach, CA (USLGB)' },
      { label: 'Place of Final Delivery', value: manualDetails.place_of_final_delivery || 'Los Angeles, CA' },
      { label: 'Shipper', value: manualDetails.shipper?.name || 'ACME EXPORTS PVT LTD' },
      { label: 'Consignee', value: manualDetails.consignee?.name || 'GLOBAL LOGISTICS LLC' },
      { label: 'Tare Weight', value: manualDetails.tare_weight || '3,800 KGS' },
      { label: 'Verified Gross Mass (VGM)', value: manualDetails.verified_gross_mass || '14,770 KGS' }
    ],
    [
      'CONSOLIDATED SHIPMENT INCLUDING ALL ASSOCIATED HOUSE BILLS OF LADING (HBL)',
      'CONTAINER: MSCU7829104 | 40HC | SEAL: ML-IN-893021',
      'CARGO: AUTO SPARE PARTS & PRECISION COMPONENTS | FCL/FCL'
    ]
  );

  return {
    filename: `MBL_PREVIEW_${mblNum}.pdf`,
    base64: pdf.base64
  };
}

/**
 * Generates final MBL PDF base64
 */
export function getMockMblGenerated(request: MblGenerationRequest): { filename: string; base64: string; blob: Blob } {
  const mblNum = request.manual_details.mbl_number || 'MSCU-MBL-2026-FINAL';
  const pdf = generateDemoPdf(
    `FINAL MASTER BILL OF LADING: ${mblNum}`,
    [
      { label: 'Final Master B/L Number', value: mblNum },
      { label: 'Carrier Booking Ref', value: request.manual_details.carrier_booking_reference || 'BKG-MSC-992019' },
      { label: 'Pre-Carriage By', value: request.manual_details.pre_carriage_by || 'Truck' },
      { label: 'Ocean Vessel', value: request.manual_details.vessel_name || 'MSC BARI' },
      { label: 'Voyage Number', value: request.manual_details.voyage_number || 'VOY-2401W' },
      { label: 'Port of Loading', value: request.manual_details.port_of_loading || 'Chennai, India (INMAA)' },
      { label: 'Port of Discharge', value: request.manual_details.port_of_discharge || 'Long Beach, CA (USLGB)' },
      { label: 'Place of Final Delivery', value: request.manual_details.place_of_final_delivery || 'Los Angeles, CA' },
      { label: 'Shipper', value: request.manual_details.shipper?.name || 'ACME EXPORTS PVT LTD' },
      { label: 'Consignee', value: request.manual_details.consignee?.name || 'GLOBAL LOGISTICS LLC' },
      { label: 'Tare Weight', value: request.manual_details.tare_weight || '3,800 KGS' },
      { label: 'Verified Gross Mass (VGM)', value: request.manual_details.verified_gross_mass || '14,770 KGS' }
    ],
    [
      'FULLY EXECUTED MASTER BILL OF LADING - ISSUED AND RELEASED',
      'ALL HBLS CONSOLIDATED ACCORDING TO CARRIER INSTRUCTIONS'
    ]
  );

  return {
    filename: `MBL_${mblNum}.pdf`,
    base64: pdf.base64,
    blob: pdf.blob
  };
}

/**
 * Creates Excel / Spreadsheet Blob for extracted invoices
 */
export function getMockInvoiceSpreadsheet(batchId: string, format: 'xlsx' | 'csv' = 'xlsx'): Blob {
  const batch = mockStore.getBatch(batchId);
  const docs = batch?.documents || [];

  if (format === 'csv') {
    let csv = 'S.No,Invoice Number,Invoice Date,Vendor Name,Gross Amount,Tax Amount,Total Amount,Status\n';
    docs.forEach((doc, idx) => {
      const pl = doc.extraction;
      const invNum = pl.invoice_number || `INV-${idx + 1}`;
      const invDate = pl.invoice_date || '14/03/2026';
      const vendor = (pl.vendor?.name || pl.shipper_exporter?.name || 'Apex Corp').replace(/,/g, '');
      const amt = pl.total_amount || '148500.00';
      csv += `${idx + 1},${invNum},${invDate},${vendor},${amt},0.00,${amt},Extracted\n`;
    });
    return new Blob([csv], { type: 'text/csv' });
  }

  // XML Spreadsheet 2003 (Natively supported by Microsoft Excel, LibreOffice, Apple Numbers as .xlsx / .xls)
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Extracted Invoices">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">S.No</Data></Cell>
    <Cell><Data ss:Type="String">Invoice No</Data></Cell>
    <Cell><Data ss:Type="String">Invoice Date</Data></Cell>
    <Cell><Data ss:Type="String">Vendor Name</Data></Cell>
    <Cell><Data ss:Type="String">Total Amount (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Extraction Status</Data></Cell>
   </Row>`;

  if (docs.length === 0) {
    xml += `
   <Row>
    <Cell><Data ss:Type="Number">1</Data></Cell>
    <Cell><Data ss:Type="String">INV-2026-0101</Data></Cell>
    <Cell><Data ss:Type="String">14/03/2026</Data></Cell>
    <Cell><Data ss:Type="String">ACME EXPORTS PVT LTD</Data></Cell>
    <Cell><Data ss:Type="Number">148500.00</Data></Cell>
    <Cell><Data ss:Type="String">Processed</Data></Cell>
   </Row>`;
  } else {
    docs.forEach((doc, idx) => {
      const pl = doc.extraction;
      const invNum = pl.invoice_number || `INV-${idx + 1}`;
      const invDate = pl.invoice_date || '14/03/2026';
      const vendor = pl.vendor?.name || pl.shipper_exporter?.name || 'Vendor';
      const amt = parseFloat(pl.total_amount || '0') || 0;
      xml += `
   <Row>
    <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(invNum)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(invDate)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(vendor)}</Data></Cell>
    <Cell><Data ss:Type="Number">${amt}</Data></Cell>
    <Cell><Data ss:Type="String">Verified</Data></Cell>
   </Row>`;
    });
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  return new Blob([xml], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

