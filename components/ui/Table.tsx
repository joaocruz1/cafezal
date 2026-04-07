"use client";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type SortDirection = "asc" | "desc";

interface SortableHeader {
  label: string;
  sortKey?: string;
  align?: "left" | "right" | "center";
}

interface TableProps {
  headers: (string | SortableHeader)[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  className?: string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Table({
  headers,
  children,
  emptyMessage = "Nenhum registro encontrado.",
  isEmpty = false,
  className = "",
  sortKey,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
}: TableProps) {
  function handleSort(key: string) {
    if (!onSort) return;
    const newDir = sortKey === key && sortDirection === "asc" ? "desc" : "asc";
    onSort(key, newDir);
  }

  return (
    <div className={`rounded-[var(--radius-lg)] border border-stone-200 bg-white overflow-hidden ${className}`} style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              {headers.map((h, i) => {
                const header = typeof h === "string" ? { label: h } : h;
                const sortable = header.sortKey && onSort;
                const isActive = sortable && sortKey === header.sortKey;
                const alignClass = header.align === "right" ? "text-right" : header.align === "center" ? "text-center" : "text-left";
                return (
                  <th
                    key={typeof h === "string" ? h : h.label}
                    scope="col"
                    className={`p-3 font-medium text-stone-700 ${alignClass} ${sortable ? "cursor-pointer select-none hover:bg-stone-100 transition-colors" : ""}`}
                    onClick={sortable ? () => handleSort(header.sortKey!) : undefined}
                    aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {header.label}
                      {sortable && (
                        <span className="inline-flex flex-col">
                          <ChevronUp className={`h-3 w-3 ${isActive && sortDirection === "asc" ? "text-stone-800" : "text-stone-300"}`} />
                          <ChevronDown className={`h-3 w-3 -mt-1 ${isActive && sortDirection === "desc" ? "text-stone-800" : "text-stone-300"}`} />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={headers.length} className="p-8 text-center text-stone-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 bg-stone-50/50 text-sm">
          <span className="text-stone-500">Pagina {currentPage} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage! - 1)}
              className="rounded-[var(--radius-md)] p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage! + 1)}
              className="rounded-[var(--radius-md)] p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Proxima pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={`border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <td className={`p-3 ${alignClass} ${className}`}>{children}</td>;
}
