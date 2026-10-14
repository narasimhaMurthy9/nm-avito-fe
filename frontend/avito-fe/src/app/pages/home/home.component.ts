import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <header class="app-header">
        <div class="header-inner">
          <img src="avito.png" alt="Avito Logo" class="header-logo" />
        </div>
      </header>

      <main class="main-content">
        <div class="hero-section">
          <h1 class="welcome-title">Welcome to <span class="brand-text">Avito Processing</span></h1>
          <p class="subtitle">Please select a workflow to begin your session</p>
        </div>

        <div class="options-grid">
          
          <a routerLink="/mbl-processing" class="option-card">
            <div class="card-glow"></div>
            <div class="icon-wrapper">
              <!-- Ship Silhouette SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64" fill="currentColor">
                <!-- Hull -->
                <polygon points="2,38 2,54 52,54 62,38" />
                
                <!-- Portholes -->
                <circle cx="12" cy="46" r="2.5" fill="#eff6ff" />
                <circle cx="24" cy="46" r="2.5" fill="#eff6ff" />
                <circle cx="36" cy="46" r="2.5" fill="#eff6ff" />
                <circle cx="48" cy="46" r="2.5" fill="#eff6ff" />

                <!-- Rear Mast -->
                <rect x="11" y="25" width="2" height="13" />
                <polygon points="8,22 16,22 13.5,25 10.5,25" />
                <rect x="11.5" y="17" width="1" height="5" />

                <!-- Containers Left Stack -->
                <rect x="16" y="33" width="10" height="4" />
                <rect x="16" y="28" width="10" height="4" />
                <rect x="16" y="23" width="10" height="4" />

                <!-- Containers Right Stack -->
                <rect x="27" y="33" width="10" height="4" />
                <rect x="27" y="28" width="10" height="4" />
                <rect x="27" y="23" width="10" height="4" />

                <!-- Crane Base & Pillar -->
                <rect x="37" y="34" width="7" height="4" />
                <rect x="39" y="10" width="3" height="26" />
                
                <!-- Crane Arm -->
                <rect x="22" y="10" width="17" height="2" />
                
                <!-- Crane Hook Drop -->
                <rect x="23" y="12" width="1" height="4" />
                <!-- Hook Base -->
                <path d="M 22.5 16 C 22.5 18, 24.5 18, 24.5 16" fill="none" stroke="currentColor" stroke-width="1.5" />

                <!-- Bridge Structure -->
                <polygon points="43,38 45,22 55,22 57,38" />
                
                <!-- Bridge Windows -->
                <rect x="46.5" y="24" width="1.5" height="2" fill="#eff6ff" />
                <rect x="49.25" y="24" width="1.5" height="2" fill="#eff6ff" />
                <rect x="52" y="24" width="1.5" height="2" fill="#eff6ff" />
                <rect x="46" y="28" width="1.5" height="2" fill="#eff6ff" />
                <rect x="49.25" y="28" width="1.5" height="2" fill="#eff6ff" />
                <rect x="52.5" y="28" width="1.5" height="2" fill="#eff6ff" />
                <rect x="45.5" y="32" width="1.5" height="2" fill="#eff6ff" />
                <rect x="49.25" y="32" width="1.5" height="2" fill="#eff6ff" />
                <rect x="53" y="32" width="1.5" height="2" fill="#eff6ff" />
              </svg>
            </div>
            <div class="card-content">
              <h2>MBL Processing</h2>
              <p>Upload packing lists and complete HBL/MBL details efficiently through an automated workflow.</p>
            </div>
            <div class="card-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </a>

          <a routerLink="/invoice-processing" class="option-card">
            <div class="card-glow"></div>
            <div class="icon-wrapper">
              <!-- Invoice SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div class="card-content">
              <h2>Vendor Invoice Processing</h2>
              <p>Upload invoices to automatically extract, review, and export structured financial data.</p>
            </div>
            <div class="card-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
          </a>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: radial-gradient(circle at 0% 0%, rgba(242, 109, 33, 0.04) 0%, transparent 40%),
                  radial-gradient(circle at 100% 100%, rgba(26, 43, 76, 0.04) 0%, transparent 40%),
                  #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .app-header {
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 1rem 2rem;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      z-index: 10;
    }
    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .header-logo {
      height: 40px;
      object-fit: contain;
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      overflow-y: auto;
    }
    .hero-section {
      text-align: center;
      margin-bottom: 3.5rem;
      animation: fadeInDown 0.6s ease-out;
    }
    .welcome-title {
      font-size: 3rem;
      color: #1a2b4c;
      margin-bottom: 1rem;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .brand-text {
      background: linear-gradient(135deg, #f26d21, #d95a16);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }
    .subtitle {
      font-size: 1.15rem;
      color: #64748b;
      margin: 0;
      font-weight: 400;
    }
    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 2rem;
      width: 100%;
      max-width: 900px;
      animation: fadeInUp 0.6s ease-out;
    }
    .option-card {
      position: relative;
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem;
      text-decoration: none;
      color: inherit;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      overflow: hidden;
      z-index: 1;
    }
    .card-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #f26d21, #fbd5c0);
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .option-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border-color: rgba(242, 109, 33, 0.2);
    }
    .option-card:hover .card-glow {
      opacity: 1;
    }
    .icon-wrapper {
      color: #f26d21;
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: #fef1eb;
      border: 1px solid rgba(242, 109, 33, 0.1);
      border-radius: 14px;
      display: inline-flex;
      transition: transform 0.4s ease;
    }
    .option-card:hover .icon-wrapper {
      transform: scale(1.05);
    }
    .card-content {
      flex: 1;
    }
    .card-content h2 {
      font-size: 1.5rem;
      color: #1a2b4c;
      margin: 0 0 0.75rem 0;
      font-weight: 700;
      letter-spacing: -0.015em;
    }
    .card-content p {
      color: #64748b;
      margin: 0;
      line-height: 1.6;
      font-size: 1rem;
    }
    .card-arrow {
      margin-top: 1.5rem;
      align-self: flex-end;
      color: #cbd5e1;
      transition: all 0.3s ease;
    }
    .option-card:hover .card-arrow {
      color: #f26d21;
      transform: translateX(6px);
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HomeComponent {}
