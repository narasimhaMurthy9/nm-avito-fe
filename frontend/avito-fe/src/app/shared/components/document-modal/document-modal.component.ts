import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-document-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-modal.component.html',

  styleUrls: ['./document-modal.component.css'],
})
export class DocumentModalComponent {
  private sanitizer = inject(DomSanitizer);
  
  @Input() isOpen = false;
  @Input() title = 'Document Preview';
  @Input() set documentUrl(url: string) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  @Input() mimeType = 'application/pdf';
  
  @Output() closed = new EventEmitter<void>();

  safeUrl: SafeResourceUrl | null = null;

  close() {
    this.isOpen = false;
    this.closed.emit();
  }
}
