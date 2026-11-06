import { useMemo, useState, type ReactNode } from "react";

export type Col<T> = { key: string; label: string; value: (r: T) => string | number | null; render?: (r: T) => ReactNode; align?: "right" };

export function SortableTable<T>({ rows, cols, rowKey, empty }: { rows: T[]; cols: Col<T>[]; rowKey: (r: T) => string; empty: string }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = cols.find((x) => x.key === sort.key);
    if (!c) return rows;
    return [...rows].sort((a, b) => {
      const x = c.value(a), y = c.value(b);
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x > y ? 1 : -1) * sort.dir;
    });
  }, [rows, cols, sort]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border bg-card text-[13px]">
        <thead>
          <tr className="bg-secondary">
            {cols.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : "none"} className={`border border-border p-0 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>
                  <button onClick={() => setSort(active && sort!.dir === 1 ? { key: c.key, dir: -1 } : { key: c.key, dir: 1 })}
                    className={`w-full px-2 py-1.5 transition-colors duration-150 hover:bg-muted ${c.align === "right" ? "text-right" : "text-left"}`}>
                    {c.label} <span className="text-muted-foreground">{active ? (sort!.dir === 1 ? "▲" : "▼") : "↕"}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={cols.length} className="border border-border px-2 py-4 text-muted-foreground">{empty}</td></tr>
          ) : sorted.map((r) => (
            <tr key={rowKey(r)} className="hover:bg-secondary/50">
              {cols.map((c) => <td key={c.key} className={`border border-border px-2 py-1.5 ${c.align === "right" ? "text-right tabular-nums" : ""}`}>{c.render ? c.render(r) : c.value(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
