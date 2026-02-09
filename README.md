# AMZAST - Amazon Data Analysis & Visualization Tool

A high-performance, client-side data visualization tool for Amazon sellers. Built with React, TypeScript, and Tailwind CSS.

## Key Features

- **Zero-Server Architecture**: All data processing happens locally in your browser. No data upload, ensuring 100% privacy.
- **Instant Excel Parsing**: Drag & drop `.xlsx` files to generate reports in milliseconds.
- **Interactive Dashboards**:
  - **Monthly Sales Trend**: Multi-year comparison with parent ASIN deduplication.
  - **Brand Monopoly Analysis**: Top 20 brands bar chart with drill-down to product lists. Market share metrics for Top 3 and Top 10.
  - **Price-Sales Distribution**: Scatter plot to analyze pricing strategies, with detailed tooltips (Image, Rating, Launch Date).
- **Modern UI**: Dark mode support, glassmorphism design, and fluid animations.
- **Smart Navigation**: Foldable sidebar and feature-card home page.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```bash
src/
├── components/         # UI Components (Charts, Sidebar, etc.)
├── pages/              # Page Views (Home, MarketAnalysis)
├── lib/                # Data Parsing & Type Definitions
└── App.tsx             # Main Application Logic
```
