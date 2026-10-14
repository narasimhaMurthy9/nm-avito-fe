import { Component, ChangeDetectionStrategy, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { WorkflowStateService } from '../../../../core/services/workflow-state.service';
import { DocumentExtractionService } from '../../../../core/services/document-extraction.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ReviewDraft } from '../../../../core/models/schemas';

@Component({
  selector: 'app-grouping-board',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './grouping-board.component.html',
  styleUrls: ['./grouping-board.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupingBoardComponent {
  workflow = inject(WorkflowStateService);
  isMultiSelectOpen = false;
  
  @Output() docClicked = new EventEmitter<ReviewDraft>();

  constructor(
    private extractionService: DocumentExtractionService,
    private toast: ToastService
  ) {}

  drop(event: CdkDragDrop<any[]>, targetGroupId: string | null) {
    if (this.workflow.isGroupSaved(targetGroupId)) return;
    
    if (event.previousContainer === event.container) {
      // Just reordering, but our backend doesn't care about order inside the group.
      // We can still do it visually if we want by updating hblReviews array, but it's complex 
      // since hblReviews is a flat array. We will just ignore intra-group reordering for now.
      return;
    }

    const movedDraft = event.previousContainer.data[event.previousIndex] as ReviewDraft;
    const sourceGroupId = movedDraft.group_id || null;
    // Check if dragging out of a saved group
    if (this.workflow.isGroupSaved(sourceGroupId)) return;

    const batchId = movedDraft.batch_id;
    const documentId = movedDraft.document_id;

    // Persist moves out of server groups before updating local membership. A new UI group
    // is created on the server as part of this request so the HBL/MBL workflow sees it too.
    if (sourceGroupId && targetGroupId && batchId && documentId
        && this.workflow.isServerGroup(sourceGroupId)) {
      const createTargetGroup = !this.workflow.isServerGroup(targetGroupId);
      this.extractionService.reassignDocuments(
        batchId, sourceGroupId, targetGroupId, [documentId], createTargetGroup
      ).subscribe({
        next: (response) => {
          this.workflow.applyReassignedGroups(response.hbl_groups);
          this.removeGroupIfEmpty(sourceGroupId, targetGroupId);
        },
        error: () => {
          this.toast.show('Could not update the shipment groups on the server. Please try again.', 'error');
        }
      });
      return;
    }

    this.workflow.moveDraftToGroup(movedDraft.draft_id, targetGroupId);
    this.removeGroupIfEmpty(sourceGroupId, targetGroupId);
  }

  private removeGroupIfEmpty(sourceGroupId: string | null, targetGroupId: string | null) {
    if (!sourceGroupId || sourceGroupId === targetGroupId) return;
    const remainingDrafts = this.workflow.enrichedHblReviews().filter(d => d.group_id === sourceGroupId);
    if (remainingDrafts.length === 0) {
      this.workflow.removeGroup(sourceGroupId);
    }
  }

  addGroup(event: Event) {
    event.stopPropagation();
    this.workflow.addGroup();
  }

  removeGroup(groupId: string) {
    this.workflow.removeGroup(groupId);
  }

  clearSuggestions(event: Event) {
    event.stopPropagation();
    this.workflow.clearSuggestions();
  }

  clearAll(event: Event) {
    event.stopPropagation();
    this.workflow.clearAll();
  }
}
