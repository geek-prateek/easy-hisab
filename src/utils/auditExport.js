/**
 * Audit Export Utilities
 * Provides Excel export functionality for audit records
 */

import writeXlsxFile from 'write-excel-file/browser';
import { determineDifferenceResult, calculateTotalAmount, calculateClosingAmount } from './auditCalculations';

function createExcelDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateForDisplay(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function getAuditResult(entry) {
  return entry.result || determineDifferenceResult(entry.difference);
}

function getDifferenceAmount(entry) {
  return Math.abs(Number(entry.difference) || 0);
}

export async function exportAuditToExcel(auditEntries, isDownloading, setIsDownloading) {
  if (isDownloading) {
    return;
  }

  setIsDownloading(true);

  try {
    const rows = [
      [
        { value: 'Date', fontWeight: 'bold' },
        { value: 'Product Name', fontWeight: 'bold' },
        { value: 'Opening Stock', fontWeight: 'bold' },
        { value: 'Purchase Stock', fontWeight: 'bold' },
        { value: 'Total Stock', fontWeight: 'bold' },
        { value: 'Issued Stock', fontWeight: 'bold' },
        { value: 'Closing Stock', fontWeight: 'bold' },
        { value: 'Slip Stock', fontWeight: 'bold' },
        { value: 'Short', fontWeight: 'bold' },
        { value: 'Extra', fontWeight: 'bold' },
      ],
      ...auditEntries.map((entry) => {
        const totalAmount = calculateTotalAmount(entry.opening, entry.purchase);
        const closingAmount = calculateClosingAmount(totalAmount, entry.used);
        const result = getAuditResult(entry);
        const differenceAmount = getDifferenceAmount(entry);

        return [
          { type: Date, value: createExcelDate(entry.date), format: 'dd/mm/yyyy' },
          { type: String, value: entry.productName },
          { type: Number, value: Number(entry.opening) || 0 },
          { type: Number, value: Number(entry.purchase) || 0 },
          { type: Number, value: totalAmount },
          { type: Number, value: Number(entry.used) || 0 },
          { type: Number, value: closingAmount },
          { type: Number, value: Number(entry.actualCount) || 0 },
          result === 'short'
            ? { type: Number, value: differenceAmount }
            : { value: '' },
          result === 'extra'
            ? { type: Number, value: differenceAmount }
            : { value: '' },
        ];
      }),
      Array.from({ length: 10 }, () => ({ value: '' })),
      [
        { value: 'Total', fontWeight: 'bold' },
        { value: '' },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => sum + (Number(entry.opening) || 0), 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => sum + (Number(entry.purchase) || 0), 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => {
            const total = calculateTotalAmount(entry.opening, entry.purchase);
            return sum + total;
          }, 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => sum + (Number(entry.used) || 0), 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => {
            const total = calculateTotalAmount(entry.opening, entry.purchase);
            const closing = calculateClosingAmount(total, entry.used);
            return sum + closing;
          }, 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => sum + (Number(entry.actualCount) || 0), 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => {
            return getAuditResult(entry) === 'short' ? sum + getDifferenceAmount(entry) : sum;
          }, 0),
          fontWeight: 'bold',
        },
        {
          type: Number,
          value: auditEntries.reduce((sum, entry) => {
            return getAuditResult(entry) === 'extra' ? sum + getDifferenceAmount(entry) : sum;
          }, 0),
          fontWeight: 'bold',
        },
      ],
    ];

    await writeXlsxFile(rows, {
      sheet: 'Audit Report',
    }).toFile('audit-report.xlsx');
  } finally {
    setIsDownloading(false);
  }
}
