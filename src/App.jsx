import { useEffect, useMemo, useState } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import DailyEntryForm from './components/DailyEntryForm';
import DailyEntryList from './components/DailyEntryList';
import StockAuditForm from './components/StockAuditForm';
import HistoryTabSwitch from './components/HistoryTabSwitch';
import { ENTRY_TYPE_OPTIONS } from './constants';
import { loadDailyEntries, saveDailyEntries, loadAuditEntries, saveAuditEntries } from './utils/storage';
import {
  calculateSystemStock,
  calculateDifference,
  determineDifferenceResult,
  validateAuditForm,
} from './utils/auditCalculations';
import { exportAuditToExcel } from './utils/auditExport';

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function createEmptyDailyForm() {
  return {
    date: getTodayDate(),
    productName: '',
    type: 'purchase',
    quantity: '',
    price: '',
    gst: '5',
  };
}

function createEmptyAuditForm() {
  return {
    date: getTodayDate(),
    productName: '',
    opening: '',
    purchase: '',
    used: '',
    actualCount: '',
  };
}

const AUDIT_NUMBER_FIELDS = new Set(['opening', 'purchase', 'used', 'actualCount']);

const typeLabels = Object.fromEntries(
  ENTRY_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const fieldChecks = [
  ['date', 'Date'],
  ['productName', 'Product Name'],
  ['type', 'Type'],
  ['quantity', 'Quantity'],
  ['price', 'Price per Unit'],
  ['gst', 'GST'],
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function createExcelDate(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function App() {
  const [activeTab, setActiveTab] = useState('billing');
  const [historyView, setHistoryView] = useState('billing');
  
  // Billing entries and form
  const [dailyEntries, setDailyEntries] = useState(() => loadDailyEntries());
  const [dailyForm, setDailyForm] = useState(() => createEmptyDailyForm());
  const [entrySearchValue, setEntrySearchValue] = useState('');
  const [entryFilterDate, setEntryFilterDate] = useState('');
  const [entryFilterType, setEntryFilterType] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  
  // Audit entries and form
  const [auditEntries, setAuditEntries] = useState(() => loadAuditEntries());
  const [auditForm, setAuditForm] = useState(() => createEmptyAuditForm());
  const [auditEditingId, setAuditEditingId] = useState(null);
  
  // Common state
  const [notice, setNotice] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    saveDailyEntries(dailyEntries);
  }, [dailyEntries]);

  useEffect(() => {
    saveAuditEntries(auditEntries);
  }, [auditEntries]);

  useEffect(() => {
    if (!notice?.text) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredDailyEntries = useMemo(() => {
    const searchText = entrySearchValue.trim().toLowerCase();

    return dailyEntries
      .filter((entry) => {
        const matchesSearch = !searchText
          || entry.productName.toLowerCase().includes(searchText);
        const matchesDate = !entryFilterDate || entry.date === entryFilterDate;
        const matchesType = !entryFilterType || entry.type === entryFilterType;

        return matchesSearch && matchesDate && matchesType;
      })
      .sort((left, right) => {
        if (left.date !== right.date) {
          return right.date.localeCompare(left.date);
        }

        return (right.savedAt || '').localeCompare(left.savedAt || '');
      });
  }, [dailyEntries, entryFilterDate, entryFilterType, entrySearchValue]);

  const filteredEntriesSummary = useMemo(() => (
    filteredDailyEntries.reduce(
      (summary, entry) => ({
        itemCount: summary.itemCount + 1,
        grandTotal: Number((summary.grandTotal + Number(entry.finalAmount || 0)).toFixed(2)),
      }),
      { itemCount: 0, grandTotal: 0 },
    )
  ), [filteredDailyEntries]);

  function resetDailyForm() {
    setDailyForm(createEmptyDailyForm());
    setEditingEntryId(null);
  }

  function resetAuditForm() {
    setAuditForm(createEmptyAuditForm());
    setAuditEditingId(null);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openBillingTab() {
    resetDailyForm();
    setNotice(null);
    setActiveTab('billing');
    scrollToTop();
  }

  function openAuditTab() {
    resetAuditForm();
    setNotice(null);
    setActiveTab('audit');
    scrollToTop();
  }

  function openHistoryTab() {
    setNotice(null);
    setActiveTab('history');
    scrollToTop();
  }

  function handleDailyChange(event) {
    const { name, value } = event.target;
    setDailyForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleDailyFieldClear(fieldName) {
    setDailyForm((currentForm) => ({
      ...currentForm,
      [fieldName]: '',
    }));
  }

  function validateDailyForm() {
    for (const [fieldName, label] of fieldChecks) {
      const value = dailyForm[fieldName];

      if (String(value ?? '').trim() === '') {
        setNotice({
          tone: 'error',
          text: `${label} is not added properly.`,
        });
        return false;
      }
    }

    return true;
  }

  function handleDailySubmit(event) {
    event.preventDefault();

    if (!validateDailyForm()) {
      return;
    }

    const cleanProductName = dailyForm.productName.trim();
    const quantity = Number(dailyForm.quantity);
    const price = Number(dailyForm.price);
    const gst = Number(dailyForm.gst);
    const totalAmount = Number((quantity * price).toFixed(2));
    const gstAmount = Number((totalAmount * (gst / 100)).toFixed(2));
    const finalAmount = Number((totalAmount + gstAmount).toFixed(2));

    const entryData = {
      id: editingEntryId ?? crypto.randomUUID(),
      date: dailyForm.date,
      productName: cleanProductName,
      type: dailyForm.type,
      quantity,
      price,
      gst,
      totalAmount,
      gstAmount,
      finalAmount,
      savedAt: new Date().toISOString(),
    };

    setDailyEntries((currentEntries) => {
      if (editingEntryId) {
        return currentEntries.map((entry) =>
          entry.id === editingEntryId ? entryData : entry,
        );
      }

      return [entryData, ...currentEntries];
    });

    resetDailyForm();
    setNotice({
      tone: 'success',
      text: 'Entry Saved Successfully!',
    });
  }

  function handleEntryEdit(entry) {
    setDailyForm({
      date: entry.date,
      productName: entry.productName,
      type: entry.type,
      quantity: String(entry.quantity),
      price: String(entry.price),
      gst: String(entry.gst),
    });
    setEditingEntryId(entry.id);
    setNotice(null);
    setActiveTab('daily');
    scrollToTop();
  }

  function handleEntryDelete(entry) {
    const confirmed = window.confirm(`Delete "${entry.productName}"?`);

    if (!confirmed) {
      return;
    }

    setDailyEntries((currentEntries) =>
      currentEntries.filter((item) => item.id !== entry.id),
    );

    if (editingEntryId === entry.id) {
      resetDailyForm();
    }
  }

  // Audit form handlers
  function handleAuditChange(event) {
    const { name, value } = event.target;

    const nextValue = AUDIT_NUMBER_FIELDS.has(name)
      ? value.replace(/[^\d]/g, '')
      : value;

    setAuditForm((currentForm) => ({
      ...currentForm,
      [name]: nextValue,
    }));
  }

  function handleAuditFieldClear(fieldName) {
    setAuditForm((currentForm) => ({
      ...currentForm,
      [fieldName]: '',
    }));
  }

  function handleAuditSubmit(event) {
    event.preventDefault();

    const validation = validateAuditForm(auditForm);
    if (!validation.isValid) {
      setNotice({
        tone: 'error',
        text: validation.errors[0],
      });
      return;
    }

    const systemStock = calculateSystemStock(auditForm.opening, auditForm.purchase, auditForm.used);
    const difference = calculateDifference(auditForm.used, auditForm.actualCount);
    const result = determineDifferenceResult(difference);

    const entryData = {
      id: auditEditingId ?? crypto.randomUUID(),
      date: auditForm.date,
      productName: auditForm.productName.trim(),
      opening: auditForm.opening === '' ? 0 : Number(auditForm.opening),
      purchase: auditForm.purchase === '' ? 0 : Number(auditForm.purchase),
      used: auditForm.used === '' ? 0 : Number(auditForm.used),
      actualCount: auditForm.actualCount === '' ? 0 : Number(auditForm.actualCount),
      systemStock,
      difference,
      result,
      savedAt: new Date().toISOString(),
    };

    setAuditEntries((currentEntries) => {
      if (auditEditingId) {
        return currentEntries.map((entry) =>
          entry.id === auditEditingId ? entryData : entry,
        );
      }

      return [entryData, ...currentEntries];
    });

    resetAuditForm();
    setNotice({
      tone: 'success',
      text: 'Audit Entry Saved Successfully!',
    });
  }

  function handleAuditEdit(entry) {
    setAuditForm({
      date: entry.date,
      productName: entry.productName,
      opening: String(entry.opening),
      purchase: String(entry.purchase),
      used: String(entry.used),
      actualCount: String(entry.actualCount),
    });
    setAuditEditingId(entry.id);
    setNotice(null);
    setActiveTab('audit');
    scrollToTop();
  }

  function handleAuditDelete(entry) {
    const confirmed = window.confirm(`Delete audit for "${entry.productName}"?`);

    if (!confirmed) {
      return;
    }

    setAuditEntries((currentEntries) =>
      currentEntries.filter((item) => item.id !== entry.id),
    );

    if (auditEditingId === entry.id) {
      resetAuditForm();
    }
  }

  async function handleAuditDownload() {
    await exportAuditToExcel(auditEntries, isDownloading, setIsDownloading);
  }

  async function handleEntryDownload() {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const rows = [
        [
          { value: 'Date', fontWeight: 'bold' },
          { value: 'Product', fontWeight: 'bold' },
          { value: 'Type', fontWeight: 'bold' },
          { value: 'Quantity', fontWeight: 'bold' },
          { value: 'Price', fontWeight: 'bold' },
          { value: 'GST', fontWeight: 'bold' },
          { value: 'Final Amount', fontWeight: 'bold' },
        ],
        ...filteredDailyEntries.map((entry) => [
          { type: Date, value: createExcelDate(entry.date), format: 'dd/mm/yyyy' },
          { type: String, value: entry.productName },
          { type: String, value: typeLabels[entry.type] },
          { type: Number, value: entry.quantity },
          { type: Number, value: entry.price },
          { type: String, value: `${entry.gst}%` },
          { type: Number, value: entry.finalAmount },
        ]),
        Array.from({ length: 7 }, () => ({ value: '' })),
        [
          {
            value: 'Total',
            fontWeight: 'bold',
          },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          { value: '' },
          {
            type: Number,
            value: filteredEntriesSummary.grandTotal,
            fontWeight: 'bold',
          },
        ],
      ];

      await writeXlsxFile(rows, {
        sheet: 'Daily Report',
      }).toFile('daily-report.xlsx');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 pb-24 sm:px-5 sm:pb-24">
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/easy-hisab-icon.png"
              alt="Easy Hisab logo"
              className="h-10 w-10 rounded-xl border border-stone-200 bg-white object-contain"
              loading="lazy"
            />
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900">Product Price Register</h1>
              <p className="mt-1 text-sm text-stone-600">Smart Tracking for Modern Growth</p>
            </div>
          </div>
        </header>

        {notice?.text ? (
          <div
            className={`pointer-events-none fixed inset-x-0 bottom-16 z-50 px-4 sm:bottom-16 sm:px-5 ${
              notice.tone === 'error' ? 'text-rose-900' : 'text-emerald-900'
            }`}
            role="status"
          >
            <div
              className={`mx-auto w-full max-w-md rounded-xl px-4 py-3 text-base font-semibold shadow-lg ring-1 ${
                notice.tone === 'error'
                  ? 'border border-rose-200 bg-rose-50 ring-rose-200'
                  : 'border border-emerald-200 bg-emerald-50 ring-emerald-200'
              }`}
            >
              {notice.text}
            </div>
          </div>
        ) : null}

        <div className="pb-6">
          {activeTab === 'billing' ? (
            <DailyEntryForm
              form={dailyForm}
              onChange={handleDailyChange}
              onClearField={handleDailyFieldClear}
              onSubmit={handleDailySubmit}
            />
          ) : null}

          {activeTab === 'audit' ? (
            <StockAuditForm
              form={auditForm}
              isEditing={auditEditingId !== null}
              onChange={handleAuditChange}
              onClearField={handleAuditFieldClear}
              onSubmit={handleAuditSubmit}
              onCancel={resetAuditForm}
            />
          ) : null}

          {activeTab === 'history' ? (
            <HistoryTabSwitch
              historyView={historyView}
              onHistoryViewChange={setHistoryView}
              // Billing records
              billingEntries={filteredDailyEntries}
              billingSearchValue={entrySearchValue}
              billingFilterDate={entryFilterDate}
              billingFilterType={entryFilterType}
              onBillingSearchChange={(event) => setEntrySearchValue(event.target.value)}
              onBillingFilterDateChange={(event) => setEntryFilterDate(event.target.value)}
              onBillingFilterTypeChange={(event) => setEntryFilterType(event.target.value)}
              onBillingClearSearch={() => setEntrySearchValue('')}
              onBillingClearFilterDate={() => setEntryFilterDate('')}
              onBillingEdit={handleEntryEdit}
              onBillingDelete={handleEntryDelete}
              onBillingDownload={handleEntryDownload}
              billingIsDownloading={isDownloading}
              billingSummary={filteredEntriesSummary}
              // Audit records
              auditEntries={auditEntries}
              onAuditEdit={handleAuditEdit}
              onAuditDelete={handleAuditDelete}
              onAuditDownload={handleAuditDownload}
              auditIsDownloading={isDownloading}
            />
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <nav className="mx-auto grid w-full max-w-md grid-cols-3 gap-1.5 rounded-t-2xl border-x border-t border-stone-200 bg-white p-1.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition ${
              activeTab === 'billing'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700'
            }`}
            onClick={openBillingTab}
          >
            <span className="text-base">💰</span>
            <span>Billing</span>
          </button>
          <button
            type="button"
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700'
            }`}
            onClick={openAuditTab}
          >
            <span className="text-base">📦</span>
            <span>Stock Check</span>
          </button>
          <button
            type="button"
            className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-50 text-stone-700'
            }`}
            onClick={openHistoryTab}
          >
            <span className="text-base">📋</span>
            <span>History</span>
          </button>
        </nav>
      </div>
    </main>
  );
}

export default App;
