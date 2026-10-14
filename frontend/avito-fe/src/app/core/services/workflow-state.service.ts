import { Injectable, signal, computed } from '@angular/core';
import { ReviewDraft, MblReview, HblGroup } from '../models/schemas';

export interface GroupedDrafts {
  groupId: string | null;
  color: string | null;
  drafts: any[];
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowStateService {
  // Core state
  readonly hblReviews = signal<ReviewDraft[]>([]);
  readonly mblReview = signal<MblReview | null>(null);
  readonly groupColors = signal<{ [groupId: string]: string }>({});
  /**
   * Group ids the server created for the uploaded batches. Locally added groups are not in
   * this set, which is how the grouping board tells a server group from a local one before
   * deciding whether a move can be persisted.
   */
  readonly serverGroupIds = signal<Set<string>>(new Set<string>());
  readonly currentStep = signal<number>(1);
  readonly availableColors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

  // Derived state (computed)
  readonly enrichedHblReviews = computed(() => {
    const drafts = this.hblReviews();
    const colors = this.groupColors();
    return drafts.map((draft, index) => {
      const gColor = draft.group_id ? colors[draft.group_id] : null;
      return {
        ...draft,
        uiGlobalIndex: index,
        uiGroupStyle: gColor ? { 'border-left': `4px solid ${gColor}` } : null
      };
    });
  });

  readonly ungroupedDrafts = computed(() => 
    this.enrichedHblReviews().filter(d => !d.group_id || !this.groupColors()[d.group_id])
  );

  readonly groupedAllDrafts = computed(() => {
    const drafts = this.enrichedHblReviews();
    const colors = this.groupColors();
    const allResult: GroupedDrafts[] = [];
    
    Object.keys(colors).forEach(groupId => {
      allResult.push({
        groupId,
        color: colors[groupId],
        drafts: drafts.filter(d => d.group_id === groupId)
      });
    });
    return allResult;
  });

  readonly groupedSelectedDrafts = computed(() => {
    // Return both actual groups and individual ungrouped files
    const allResult = this.groupedAllDrafts().filter(g => g.drafts.length > 0);
    const singles = this.ungroupedDrafts().map(draft => ({
      groupId: draft.group_id || null,
      color: null,
      drafts: [draft]
    }));
    return [...allResult, ...singles];
  });

  readonly canShowMbl = computed(() => {
    const reviews = this.enrichedHblReviews();
    return reviews.length > 0 && reviews.every(r => !!r.hbl_pdf);
  });

  // Actions
  setHblReviews(reviews: ReviewDraft[]) {
    this.hblReviews.set(reviews);
  }

  setGroupColors(colors: { [groupId: string]: string }) {
    this.groupColors.set(colors);
  }

  /** Merges newly returned server group ids into the known set. */
  addServerGroupIds(groupIds: string[]) {
    if (groupIds.length === 0) return;
    this.serverGroupIds.update(existing => new Set([...existing, ...groupIds]));
  }

  isServerGroup(groupId: string | null): boolean {
    return !!groupId && this.serverGroupIds().has(groupId);
  }

  setMblReview(review: MblReview | null) {
    this.mblReview.set(review);
  }

  setCurrentStep(step: number) {
    this.currentStep.set(step);
  }

  getGroupIndex(groupId: string): number {
    return Object.keys(this.groupColors()).indexOf(groupId);
  }

  updateDraft(draftId: string, changes: Partial<ReviewDraft>) {
    this.hblReviews.update(drafts => 
      drafts.map(d => d.draft_id === draftId ? { ...d, ...changes } : d)
    );
  }

  moveDraftToGroup(draftId: string, groupId: string | null) {
    this.hblReviews.update(drafts => 
      drafts.map(d => {
        if (d.draft_id === draftId) {
          return { ...d, group_id: groupId || d.group_id };
        }
        return d;
      })
    );
  }

  /** Updates group membership and combined extraction without replacing per-file extraction. */
  applyReassignedGroups(groups: HblGroup[]) {
    const groupIds = new Set(groups.map(group => group.group_id));
    const previousServerGroupIds = this.serverGroupIds();
    this.serverGroupIds.set(new Set([
      ...[...previousServerGroupIds].filter(groupId => groupIds.has(groupId)),
      ...groupIds
    ]));
    this.groupColors.update(colors => {
      const nextColors = { ...colors };
      for (const groupId of previousServerGroupIds) {
        if (!groupIds.has(groupId)) delete nextColors[groupId];
      }
      return nextColors;
    });
    this.hblReviews.update(drafts =>
      drafts.map(d => {
        const group = groups.find(g => g.document_ids.includes(d.document_id || ''));
        if (!group) return d;
        return {
          ...d,
          group_id: group.group_id,
          group_packing_list: JSON.parse(JSON.stringify(group.combined_extraction))
        };
      })
    );
  }

  applyBatchGroups(batchId: string, groups: HblGroup[], newDocumentIds: string[] = []) {
    const groupsByDocumentId = new Map(
      groups.flatMap(group => group.document_ids.map(documentId => [documentId, group] as const))
    );
    const newDocumentIdSet = new Set(newDocumentIds);
    this.addServerGroupIds(groups.map(group => group.group_id));
    this.hblReviews.update(drafts =>
      drafts.map(draft => {
        if (draft.batch_id !== batchId || !draft.document_id) return draft;
        const group = groupsByDocumentId.get(draft.document_id);
        if (!group) return draft;
        const groupChanged = group.document_ids.some(documentId => newDocumentIdSet.has(documentId));
        return {
          ...draft,
          group_id: group.group_id,
          group_packing_list: JSON.parse(JSON.stringify(group.combined_extraction)),
          ...(groupChanged ? {
            details_confirmed: false,
            hbl_pdf: undefined,
            hbl_filename: undefined
          } : {})
        };
      })
    );
  }

  addGroup() {
    this.groupColors.update(colors => {
      const nextIndex = Object.keys(colors).length;
      const newGroupId = `group_${Math.random().toString(36).substring(7)}`;
      return {
        ...colors,
        [newGroupId]: this.availableColors[nextIndex % this.availableColors.length]
      };
    });
  }

  removeGroup(groupId: string) {
    // Remove group color so drafts become ungrouped
    this.groupColors.update(colors => {
      const newColors = { ...colors };
      delete newColors[groupId];
      return newColors;
    });
  }

  clearSuggestions() {
    this.groupColors.set({});
    this.hblReviews.update(drafts => 
      drafts.map(draft => ({
        ...draft,
        details_confirmed: false,
        hbl_details: {
          hbl_number: null,
          notify_party: JSON.parse(JSON.stringify(draft.packing_list.notify_party || { name: null, address: null, tax_id: null })),
          container_number: draft.packing_list.containers?.[0]?.container_number || null,
          seal_number: draft.packing_list.containers?.[0]?.seal_numbers?.[0] || null,
          freight_terms: draft.packing_list.freight_terms
        },
        hbl_number: undefined,
        hbl_pdf: undefined,
        hbl_filename: undefined
      }))
    );
    this.mblReview.set(null);
    this.currentStep.set(1);
  }

  clearAll() {
    this.hblReviews.set([]);
    this.mblReview.set(null);
    this.currentStep.set(1);
    this.groupColors.set({});
    this.serverGroupIds.set(new Set<string>());
  }

  isGroupSaved(groupId: string | null): boolean {
    if (!groupId) return false;
    return this.enrichedHblReviews().some(d => d.group_id === groupId && d.details_confirmed);
  }
}
