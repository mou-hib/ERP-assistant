"use client";

import type { TableData } from "@/types";

interface DataTableProps {
  data: TableData | null;
  title: string;
}

const STATUT_PILLS: Record<string, string> = {
  LIVREE: "pill--good",
  EXPEDIEE: "pill--warn",
  EN_ATTENTE: "pill--warn",
  CONFIRMEE: "pill--warn",
  ANNULEE: "pill--danger",
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function toCsv(columns: string[], data: TableData): string {
  const escape = (v: unknown) => `"${formatCell(v).replace(/"/g, '""')}"`;
  const header = columns.map(escape).join(",");
  const rows = data.map((row) => columns.map((c) => escape(row[c])).join(","));
  return [header, ...rows].join("\n");
}

export default function DataTable({ data, title }: DataTableProps) {
  // Aucune question posée pour l'instant
  if (data === null) {
    return (
      <div className="data-panel">
        <div className="panel-header">Données</div>
        <div className="empty-state">
          Les données s&apos;afficheront ici après votre première question.
        </div>
      </div>
    );
  }

  // Colonnes dynamiques : union des clés de toutes les lignes
  const columns = Array.from(new Set(data.flatMap((row) => Object.keys(row))));
  const count = data.length;

  function handleExportCsv() {
    if (!data || data.length === 0) return;
    const blob = new Blob([toCsv(columns, data)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resultats.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    if (!data || data.length === 0) return;
    void navigator.clipboard.writeText(toCsv(columns, data));
  }

  return (
    <div className="data-panel">
      <div className="data-header">
        <div className="data-title">
          {title}
          <span className="data-count">
            {count} résultat{count > 1 ? "s" : ""}
          </span>
        </div>
        <div className="data-actions">
          <button
            type="button"
            className="btn-small"
            onClick={handleExportCsv}
            disabled={count === 0}
          >
            Exporter CSV
          </button>
          <button
            type="button"
            className="btn-small"
            onClick={handleCopy}
            disabled={count === 0}
          >
            Copier
          </button>
        </div>
      </div>

      <div className="data-body">
        {count === 0 ? (
          <div className="empty-state">Aucun résultat trouvé.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => {
                    const value = row[column];
                    const pill =
                      column === "statut" &&
                      typeof value === "string" &&
                      STATUT_PILLS[value];
                    return (
                      <td key={column}>
                        {pill ? (
                          <span className={`pill ${pill}`}>
                            {formatCell(value).replace(/_/g, " ")}
                          </span>
                        ) : (
                          formatCell(value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="data-footer">
        <span>
          {count === 0 ? "0 sur 0" : `1–${count} sur ${count}`}
        </span>
        <div className="pager">
          <button type="button" className="page-btn" disabled aria-label="Page précédente">
            ‹
          </button>
          <button type="button" className="page-btn" disabled aria-label="Page suivante">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
