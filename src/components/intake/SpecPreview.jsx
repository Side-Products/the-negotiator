// Live job-spec preview — rendered purely from the vertical's jobSpec.fields.
// Inputs are uncontrolled, keyed by the server value, so voice/doc updates
// remount them with fresh values while typing is never clobbered by polling.

import getVertical from "@/config/verticals";
import { CutButton } from "@/components/ui/CutButton";
import { Lock, Plus, X } from "lucide-react";

const isFilled = (v) =>
  v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);

const emptyRow = (itemShape) =>
  Object.fromEntries(
    Object.entries(itemShape).map(([key, type]) => [
      key,
      type === "number" ? 1 : type === "boolean" ? false : "",
    ])
  );

function ListEditor({ field, value, onEdit }) {
  const shape = field.itemShape || { item: "string" };
  const cols = Object.entries(shape);
  const rows = Array.isArray(value) ? value : [];

  const commitCell = (i, col, v) =>
    onEdit(field.key, rows.map((r, j) => (j === i ? { ...r, [col]: v } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          {cols.map(([col, type]) =>
            type === "boolean" ? (
              <label key={col} className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  defaultChecked={!!row[col]}
                  className="rounded border-border text-primary-400"
                  onChange={(e) => commitCell(i, col, e.target.checked)}
                />
                {col}
              </label>
            ) : (
              <input
                key={col}
                type={type === "number" ? "number" : "text"}
                defaultValue={row[col] ?? ""}
                placeholder={col}
                className={`input ${type === "number" ? "w-20 shrink-0" : ""}`}
                onBlur={(e) => {
                  const v = type === "number" ? Number(e.target.value) || 0 : e.target.value;
                  if (v !== row[col]) commitCell(i, col, v);
                }}
              />
            )
          )}
          <button
            type="button"
            aria-label="Remove item"
            className="shrink-0 p-1 text-muted-foreground hover:text-error-500"
            onClick={() => onEdit(field.key, rows.filter((_, j) => j !== i))}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-700"
        onClick={() => onEdit(field.key, [...rows, emptyRow(shape)])}
      >
        <Plus className="h-4 w-4" /> Add item
      </button>
    </div>
  );
}

function FieldEditor({ field, value, onEdit }) {
  // Remount when the server value changes so defaultValue stays in sync.
  const k = JSON.stringify(value ?? null);

  switch (field.type) {
    case "enum":
      return (
        <select
          key={k}
          defaultValue={value ?? ""}
          className="input"
          onChange={(e) => onEdit(field.key, e.target.value)}
        >
          <option value="" disabled>
            Select…
          </option>
          {(field.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "boolean":
      return (
        <label key={k} className="flex items-center gap-2 py-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={!!value}
            className="rounded border-border text-primary-400"
            onChange={(e) => onEdit(field.key, e.target.checked)}
          />
          Yes
        </label>
      );
    case "number":
      return (
        <input
          key={k}
          type="number"
          defaultValue={value ?? ""}
          className="input"
          onBlur={(e) => {
            const v = e.target.value === "" ? null : Number(e.target.value);
            if (v !== (value ?? null)) onEdit(field.key, v);
          }}
        />
      );
    case "date":
      return (
        <input
          key={k}
          type="date"
          defaultValue={value ?? ""}
          className="input"
          onChange={(e) => {
            if (e.target.value && e.target.value !== value) onEdit(field.key, e.target.value);
          }}
        />
      );
    case "list":
      return <ListEditor key={k} field={field} value={value} onEdit={onEdit} />;
    default:
      return (
        <input
          key={k}
          type="text"
          defaultValue={value ?? ""}
          className="input"
          onBlur={(e) => {
            if (e.target.value !== (value ?? "")) onEdit(field.key, e.target.value);
          }}
        />
      );
  }
}

function ReadOnlyValue({ field, value }) {
  if (!isFilled(value)) return <span className="text-muted-foreground">—</span>;
  if (field.type === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (field.type === "list") {
    const cols = Object.entries(field.itemShape || { item: "string" });
    return (
      <ul className="space-y-1">
        {value.map((row, i) => (
          <li key={i}>
            {cols
              .map(([col, type]) => (type === "boolean" ? (row[col] ? col : null) : row[col]))
              .filter((v) => v !== null && v !== undefined && v !== "")
              .join(" · ")}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{String(value)}</span>;
}

export default function SpecPreview({ job, onFieldEdit, onConfirm }) {
  const vertical = getVertical(job.vertical);
  const fields = vertical?.jobSpec?.fields || [];
  const spec = job.spec || {};

  const required = fields.filter((f) => f.required);
  const filled = required.filter((f) => isFilled(spec[f.key]));
  const complete = filled.length === required.length;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Job spec</h2>
        <div className="flex items-center gap-2">
          <span className="badge badge-info">Spec v{job.specVersion || 1}</span>
          {job.confirmed && (
            <span className="badge badge-success">
              <Lock className="mr-1 h-3 w-3" /> Confirmed · frozen
            </span>
          )}
        </div>
      </div>

      {!job.confirmed && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Required fields</span>
            <span>
              {filled.length}/{required.length}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary-400 transition-all duration-300"
              style={{ width: `${required.length ? (filled.length / required.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <dl className="mt-4 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {field.label}
              {field.required && !isFilled(spec[field.key]) && !job.confirmed && (
                <span className="text-error-500">*</span>
              )}
            </dt>
            <dd className="text-sm">
              {job.confirmed ? (
                <ReadOnlyValue field={field} value={spec[field.key]} />
              ) : (
                <FieldEditor field={field} value={spec[field.key]} onEdit={onFieldEdit} />
              )}
            </dd>
          </div>
        ))}
      </dl>

      {!job.confirmed && (
        <div className="mt-6">
          <CutButton fullWidth onClick={onConfirm} disabled={!complete}>
            Confirm spec — freeze v{job.specVersion || 1}
          </CutButton>
          {!complete && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Fill every required field to confirm.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
