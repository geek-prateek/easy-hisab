function ProductList({
  products,
  searchValue,
  onSearchChange,
  onEdit,
  onDelete,
  onDownload,
}) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <div className="mb-4 space-y-3">
        <h2 className="text-xl font-bold text-stone-900">View Products</h2>

        <input
          className="text-input"
          type="text"
          placeholder="Search product name"
          value={searchValue}
          onChange={onSearchChange}
          autoComplete="off"
        />

        <button className="secondary-button w-full" type="button" onClick={onDownload}>
          Download Current Product List
        </button>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-base text-stone-600">
            No products found.
          </div>
        ) : (
          products.map((product) => (
            <article
              key={product.id}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-stone-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-stone-600">GST: {product.gst}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-600">Final Price</p>
                  <p className="text-xl font-bold text-emerald-700">
                    Rs. {Number(product.finalPrice).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-base text-stone-800">
                <div className="rounded-lg bg-white px-3 py-3">
                  <p className="text-sm text-stone-500">Price</p>
                  <p className="mt-1 font-semibold">Rs. {Number(product.price).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-white px-3 py-3">
                  <p className="text-sm text-stone-500">Quantity</p>
                  <p className="mt-1 font-semibold">{product.quantity}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  className="icon-action bg-amber-100 text-amber-900"
                  type="button"
                  onClick={() => onEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="icon-action bg-rose-100 text-rose-900"
                  type="button"
                  onClick={() => onDelete(product)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default ProductList;
