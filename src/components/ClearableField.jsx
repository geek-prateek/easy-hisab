function ClearButtonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearableField({
  children,
  hasValue,
  onClear,
  clearLabel,
  clearButtonClassName = 'right-3',
}) {
  return (
    <div className="relative">
      {children}

      {hasValue ? (
        <button
          aria-label={clearLabel}
          className={`clear-field-button ${clearButtonClassName}`}
          type="button"
          onClick={onClear}
        >
          <ClearButtonIcon />
        </button>
      ) : null}
    </div>
  );
}

export default ClearableField;
