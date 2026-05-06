import { ENTRY_TYPE_OPTIONS, GST_OPTIONS } from '../constants';
import ClearableField from './ClearableField';

function DailyEntryForm({
  form,
  onChange,
  onSubmit,
  onClearField,
}) {
  const quantity = Number(form.quantity || 0);
  const price = Number(form.price || 0);
  const gst = Number(form.gst || 0);
  const totalAmount = quantity * price;
  const gstAmount = totalAmount * (gst / 100);
  const finalAmount = totalAmount + gstAmount;

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-stone-900">Daily Entry</h2>
        <p className="mt-1 text-sm text-stone-600">Fill the details and save.</p>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block">
          <span className="field-label">Date</span>
          <ClearableField
            hasValue={Boolean(form.date)}
            onClear={() => onClearField('date')}
            clearLabel="Clear date"
            clearButtonClassName="right-12"
          >
            <input
              className="text-input clearable-date-input"
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
            />
          </ClearableField>
        </label>

        <label className="block">
          <span className="field-label">Product Name</span>
          <ClearableField
            hasValue={Boolean(form.productName)}
            onClear={() => onClearField('productName')}
            clearLabel="Clear product name"
          >
            <input
              className="text-input clearable-input"
              name="productName"
              type="text"
              value={form.productName}
              onChange={onChange}
              placeholder="Enter product name"
              autoComplete="off"
              required
            />
          </ClearableField>
        </label>

        <label className="block">
          <span className="field-label">Type</span>
          <select
            className="select-input"
            name="type"
            value={form.type}
            onChange={onChange}
          >
            {ENTRY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Quantity</span>
          <input
            className="text-input"
            name="quantity"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.quantity}
            onChange={onChange}
            placeholder="Enter quantity"
            required
          />
        </label>

        <label className="block">
          <span className="field-label">Price per Unit</span>
          <input
            className="text-input"
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.price}
            onChange={onChange}
            placeholder="Enter price per unit"
            required
          />
        </label>

        <label className="block">
          <span className="field-label">GST (%)</span>
          <select
            className="select-input"
            name="gst"
            value={form.gst}
            onChange={onChange}
          >
            {GST_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}%
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-600">Total Amount</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">
              Rs. {totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-sm font-medium text-stone-600">GST Amount</p>
            <p className="mt-1 text-2xl font-bold text-stone-900">
              Rs. {gstAmount.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-800">Final Amount</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              Rs. {finalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <button className="primary-button" type="submit">
          Save
        </button>
      </form>
    </section>
  );
}

export default DailyEntryForm;
