# Stock & Price Ledger

Ultra-simple mobile-first web app for managing textile product pricing and daily stock-in / stock-out entries without Excel.

## Stack

- React + Vite
- Tailwind CSS
- localStorage for data storage
- `write-excel-file` for `.xlsx` export

## Main Features

- Add, edit, search, delete, and export product pricing
- Daily Entry screen for Purchase (Stock In) and Dispatch (Stock Out)
- Daily report export to `.xlsx`

## Folder Structure

```text
product-register/
|-- src/
|   |-- components/
|   |   |-- ProductForm.jsx
|   |   `-- ProductList.jsx
|   |-- utils/
|   |   `-- storage.js
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
`-- vite.config.js
```

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite in your browser.

## Build for Production

```bash
npm run build
```
