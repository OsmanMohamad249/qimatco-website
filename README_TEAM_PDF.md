# Team Management + PDF Snapshot

This repo already includes the Team Management Admin tab and a PDF snapshot flow for quotes.

## Run locally

```powershell
npm install
npm start
```

## Build

```powershell
npm run build
```

## PDF Snapshot

Use the Quotes tab in `src/ui/AdminPanel.js`, select a quote, fill item prices, then click the "Download Official Quotation (PDF)" button.
The PDF is generated using html2canvas and jsPDF.

## Team Management

The Team tab in `src/ui/AdminPanel.js` supports Departments, Sections, Titles, and Employees.
The frontend org chart is rendered in `src/ui/Team.js`.

