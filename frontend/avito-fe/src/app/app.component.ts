import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <app-toast></app-toast>
    <router-outlet></router-outlet>
    
    <!-- Global Powered By Logo -->
    <div style="position: fixed; bottom: 24px; right: 24px; text-align: right; z-index: 1000; pointer-events: none;">
      <span style="display: block; font-size: 0.60rem; color: #64748b; margin-bottom: 4px; font-weight: 500;">Powered by</span>
      <img src="https://logisticsstudio.com/wp-content/uploads/2024/04/Logistics-Studio-logo_hd-1-250x88.png" alt="Logistics Studio" style="height: 30px; opacity: 0.85;" />
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {}

