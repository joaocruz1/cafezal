"use client";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  className?: string;
}

export function Table({
  headers,
  children,
  emptyMessage = "Nenhum registro encontrado.",
  isEmpty = false,
  className = "",
}: TableProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left p-3 font-medium text-neutral-700">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="p-6 text-center text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
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
    <tr className={`border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50 ${className}`}>
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
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";
  return <td className={`p-3 ${alignClass} ${className}`}>{children}</td>;
}
