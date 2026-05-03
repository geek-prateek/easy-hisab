import { GST_OPTIONS } from '../constants';

function ProductForm({
  form,
  onChange,
  onSubmit,
  onCancelEdit,
  isEditing,
}) {
  const finalPrice = form.price
    ? (Number(form.price) * (1 + Number(form.gst) / 100)).toFixed(2)
    : '0.00';

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-stone-900">
          {isEditing ? 'Edit Product' : 'Add Product'}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {isEditing ? 'Update the product details and save.' : 'Enter the product details and save.'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="field-label">Product Name</span>
          <input
            className="text-input"
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            placeholder="Enter product name"
            autoComplete="off"
            required
          />
        </label>

        <label className="block">
          <span className="field-label">Price</span>
          <input
            className="text-input"
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.price}
            onChange={onChange}
            placeholder="Enter price"
            required
          />
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

        <div className="rounded-lg bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">Final Price</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">Rs. {finalPrice}</p>
        </div>

        <button className="primary-button" type="submit">
          {isEditing ? 'Update Product' : 'Save'}
        </button>

        {isEditing ? (
          <button className="secondary-button w-full" type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        ) : null}
      </form>
    </section>
  );
}

export default ProductForm;
