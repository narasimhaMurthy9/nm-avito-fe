import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toasts = signal<Toast[]>([]);
  private idCounter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = this.idCounter++;
    const toast: Toast = { id, message, type };
    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}

