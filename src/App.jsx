import { useEffect, useMemo, useState } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import DailyEntryForm from './components/DailyEntryForm';
import DailyEntryList from './components/DailyEntryList';
import { ENTRY_TYPE_OPTIONS } from './constants';
import { loadDailyEntries, loadProducts, saveDailyEntries } from './utils/storage';

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

function App() {
  const [activeTab, setActiveTab] = useState('daily');
  const [savedProducts] = useState(() => loadProducts());
  const [dailyEntries, setDailyEntries] = useState(() => loadDailyEntries());
  const [dailyForm, setDailyForm] = useState(() => createEmptyDailyForm());
  const [entrySearchValue, setEntrySearchValue] = useState('');
  const [entryFilterDate, setEntryFilterDate] = useState('');
  const [entryFilterType, setEntryFilterType] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    saveDailyEntries(dailyEntries);
  }, [dailyEntries]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMessage('');
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [message]);

  const productNames = useMemo(() => {
    const names = new Set();

    savedProducts.forEach((product) => {
      if (product.name?.trim()) {
        names.add(product.name.trim());
      }
    });

    dailyEntries.forEach((entry) => {
      if (entry.productName?.trim()) {
        names.add(entry.productName.trim());
      }
    });

    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }, [dailyEntries, savedProducts]);

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

  function resetDailyForm() {
    setDailyForm(createEmptyDailyForm());
    setEditingEntryId(null);
  }

  function openDailyTab() {
    resetDailyForm();
    setMessage('');
    setActiveTab('daily');
  }

  function handleDailyChange(event) {
    const { name, value } = event.target;
    setDailyForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function validateDailyForm() {
    for (const [fieldName, label] of fieldChecks) {
      const value = dailyForm[fieldName];

      if (String(value ?? '').trim() === '') {
        setMessage(`${label} is not added properly.`);
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
    setMessage('Product Saved succesfully');
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
    setMessage('');
    setActiveTab('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  async function handleEntryDownload() {
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
        { type: String, value: entry.date },
        { type: String, value: entry.productName },
        { type: String, value: typeLabels[entry.type] },
        { type: Number, value: entry.quantity },
        { type: Number, value: entry.price },
        { type: String, value: `${entry.gst}%` },
        { type: Number, value: entry.finalAmount },
      ]),
    ];

    await writeXlsxFile(rows, {
      sheet: 'Daily Report',
    }).toFile('daily-report.xlsx');
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 sm:px-5">
        <header className="mb-4">
          <h1 className="text-2xl font-extrabold text-stone-900">Product Price Register</h1>
          <p className="mt-1 text-sm text-stone-600">Simple pricing for your shop.</p>
        </header>

        <nav className="mb-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`min-h-14 rounded-lg px-4 text-base font-bold transition ${
              activeTab === 'daily'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-800 ring-1 ring-stone-200'
            }`}
            onClick={openDailyTab}
          >
            Daily Entry
          </button>
          <button
            type="button"
            className={`min-h-14 rounded-lg px-4 text-base font-bold transition ${
              activeTab === 'view'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-800 ring-1 ring-stone-200'
            }`}
            onClick={() => {
              setMessage('');
              setActiveTab('view');
            }}
          >
            View Products
          </button>
        </nav>

        {message ? (
          <div
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-medium text-emerald-900"
            role="status"
          >
            {message}
          </div>
        ) : null}

        <div className="pb-6">
          {activeTab === 'daily' ? (
            <DailyEntryForm
              form={dailyForm}
              productNames={productNames}
              onChange={handleDailyChange}
              onSubmit={handleDailySubmit}
            />
          ) : null}

          {activeTab === 'view' ? (
            <DailyEntryList
              entries={filteredDailyEntries}
              searchValue={entrySearchValue}
              filterDate={entryFilterDate}
              filterType={entryFilterType}
              onSearchChange={(event) => setEntrySearchValue(event.target.value)}
              onFilterDateChange={(event) => setEntryFilterDate(event.target.value)}
              onFilterTypeChange={(event) => setEntryFilterType(event.target.value)}
              onEdit={handleEntryEdit}
              onDelete={handleEntryDelete}
              onDownload={handleEntryDownload}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default App;
