# DataLens

CSV analytics dashboard. Upload any CSV file and instantly get auto-generated charts, summary statistics, and AI narrative insights — no coding required.

Built for **CS 433 — Data Analytics** at Southeast Missouri State University.

## Features

- Drag and drop CSV upload (or browse to select)
- KPI cards: row count, column count, numeric columns, missing values
- Auto-generated bar chart (first numeric column)
- Auto-generated doughnut chart (first categorical column)
- Data preview table (first 8 rows, scrollable)
- AI narrative insights: summary, 4 key findings, anomaly detection, recommendation
- 3 built-in sample datasets (sales, student grades, tech jobs)
- Reset and upload a new file without refreshing

## Project Structure

```
datalens/
├── index.html        # HTML layout and structure
├── css/
│   └── style.css     # Dark purple theme, CSS variables, responsive grid
├── js/
│   └── app.js        # CSV parsing, chart building, AI insights, state management
└── README.md
```

## Tech Stack

- Vanilla HTML / CSS / JavaScript
- [Chart.js 4.4.1](https://www.chartjs.org/) — bar and doughnut charts
- [PapaParse 5.4.1](https://www.papaparse.com/) — CSV parsing
- LLM inference API — natural language dataset insights
- Fonts: Outfit + Fira Code (Google Fonts)

## Running Locally

Open `index.html` in any modern browser. Chart.js and PapaParse load from CDN — internet connection needed.

AI insights require a valid API key configured in `js/app.js`.

## Known Issues / TODO

- Wide CSVs (20+ columns) cause horizontal scroll in the preview table on mobile — need to add column pinning
- Doesn't support Excel files (.xlsx), CSV only for now
- TODO: add chart export to PNG

## Course Context

In CS 433 we spent a lot of time on exploratory data analysis in Python — loading datasets, checking dtypes, plotting distributions. This project automates that first-pass EDA step for non-technical users. The AI layer surfaces patterns that would otherwise take several minutes of manual analysis to spot.

## Author

Tarunima Amisha · [github.com/amisha53](https://github.com/amisha53) · SEMO CS 2026
