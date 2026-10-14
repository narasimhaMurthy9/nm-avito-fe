import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.css'],
})
export class UploaderComponent {
  @Input() buttonText: string = 'Extract Packing Lists';
  @Output() filesSelected = new EventEmitter<File[]>();
  @Input() showPreview: boolean = false;
  @Output() previewFile = new EventEmitter<File>();
  isDragging = false;
  selectedFiles: File[] = [];

  constructor(private toast: ToastService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
    input.value = ''; // reset
  }

  addFiles(files: File[]) {
    const existingNames = new Set(this.selectedFiles.map(f => f.name));
    const newFiles = files.filter(f => !existingNames.has(f.name));
    
    if (newFiles.length < files.length) {
      this.toast.show('Skipped duplicate files with the same name.', 'info');
    }
    
    if (newFiles.length > 0) {
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  clearAll() {
    this.selectedFiles = [];
  }

  onPreview(file: File) {
    this.previewFile.emit(file);
  }

  extract() {
    if (this.selectedFiles.length > 0) {
      this.filesSelected.emit([...this.selectedFiles]);
      console.log(this.selectedFiles)
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
