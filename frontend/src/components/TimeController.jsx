const RANGES = [
  { id: '1_month', label: '1M' },
  { id: '3_months', label: '3M' },
  { id: '6_months', label: '6M' },
  { id: '12_months', label: '12M' },
  { id: '24_months', label: '24M' },
  { id: '10_years', label: '10Y' },
];

export function TimeController({ currentRange, onRangeChange, isLoading }) {
  return (
    <div className="time-controller" aria-label="archive depth selector">
      <span>{isLoading ? 'ANALYZING...' : 'ARCHIVE_DEPTH:'}</span>
      <div>
        {RANGES.map((range) => (
          <button
            key={range.id}
            disabled={isLoading}
            onClick={() => onRangeChange(range.id)}
            className={currentRange === range.id ? 'active' : ''}
            type="button"
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
