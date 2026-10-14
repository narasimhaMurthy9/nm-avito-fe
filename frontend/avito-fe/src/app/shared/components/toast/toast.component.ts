import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./toast.component.css'],
  templateUrl: './toast.component.html',
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  close(id: number) {
    this.toastService.remove(id);
  }
}

