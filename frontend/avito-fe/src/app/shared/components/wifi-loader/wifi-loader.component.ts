import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wifi-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wifi-loader.component.html',
})
export class WifiLoaderComponent {
  @Input() show = false;
  @Input() text = 'extracting';
}
