"use client";
import { useState } from "react";

interface Column {
  key: string;
  label: string;
  editable?: boolean;
  format?: (v: unknown) => string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onCellEdit?: (rowIndex: number, key: string, value: string) => void;
}

export default function DataTable({ columns, data, onCellEdit }: DataTableProps) {
  const [editing, setEditing] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (row: number, col: string, currentValue: unknown) => {
    setEditing({ row, col });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (editing && onCellEdit) {
      onCellEdit(editing.row, editing.col, editValue);
    }
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((row, ri) => (
            <tr
              key={ri}
              className={`${
                ri % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"
              } hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors`}
            >
              {columns.map((col) => {
                const isEditing = editing?.row === ri && editing?.col === col.key;
                const val = row[col.key];
                const display = col.format ? col.format(val) : String(val ?? "");

                return (
                  <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        onBlur={commitEdit}
                        className="w-full px-2 py-1 border border-blue-500 rounded bg-white dark:bg-slate-700 text-sm outline-none"
                      />
                    ) : (
                      <span
                        onClick={() => col.editable && startEdit(ri, col.key, val)}
                        className={col.editable ? "cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-600 px-2 py-1 rounded" : ""}
                      >
                        {display}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
