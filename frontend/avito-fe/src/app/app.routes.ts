import { Routes } from '@angular/router';
import { WorkflowStateService } from './core/services/workflow-state.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'mbl-processing',
    // Scoped to this route so a fresh instance is created on every visit. The service is
    // otherwise a root singleton, which made this page accumulate packing lists from
    // earlier visits and share them with the other workflows.
    providers: [WorkflowStateService],
    loadComponent: () => import('./pages/mbl-flow/mbl-flow.component').then(m => m.MblFlowComponent)
  },
  {
    path: 'invoice-processing',
    loadComponent: () => import('./pages/invoice-flow/invoice-flow.component').then(m => m.InvoiceFlowComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
