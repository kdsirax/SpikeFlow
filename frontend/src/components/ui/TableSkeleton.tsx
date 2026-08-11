export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-6 space-y-3">
      {[...Array(rows)].map((_, r) => (
        <div
          key={r}
          className="h-12 bg-slate-850/60 rounded-lg animate-pulse w-full flex items-center px-4 gap-4"
        >
          {[...Array(cols)].map((_, c) => (
            <div
              key={c}
              className="h-4 bg-slate-800 rounded"
              style={{ width: `${Math.floor(60 / cols) + ((r + c) % 3) * 10}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
